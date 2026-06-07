import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import os from 'os';
import { apiLimiter, xssSanitizer } from './middleware/securityMiddleware.js';
import logger from './utils/logger.js';
import { chat, getHistory } from './controllers/chatController.js';
import { isRedisEnabled } from './config/redis.js'; // Initialize Redis connection
import authRoutes from './routes/authRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import therapistApplicationRoutes from './routes/therapistApplicationRoutes.js';
import { auth } from './middleware/authMiddleware.js';
import { initConsultationSocket } from './socket/consultationSocket.js';

dotenv.config();

const app = express();
// Wrap Express in a plain Node http.Server so Socket.io can share the same port.
// Nothing else changes — app.listen below still binds to PORT as before.
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://192.168.137.1:5173",
    "http://192.168.137.1:5174",
    "http://192.168.200.1:5173",
    "http://192.168.200.1:5174"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // Dynamic allowed origins for development and local network
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('[::1]');
        const isPrivateIP = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);
        const isAllowedSubdomain = /\.mindwellhealth\.ai$/.test(origin);

        if (isLocalhost || isPrivateIP || isAllowedSubdomain) {
            callback(null, true);
        } else {
            logger.warn(`MindWell: CORS blocked for origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// ── Socket.io — shares the same httpServer and port as Express ──────────────
// CORS config mirrors the Express policy so browser WebSocket upgrades are allowed.
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('[::1]');
            const isPrivateIP = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);
            const isAllowedSubdomain = /\.mindwellhealth\.ai$/.test(origin);
            if (isLocalhost || isPrivateIP || isAllowedSubdomain) {
                callback(null, true);
            } else {
                callback(new Error('Socket.io: origin not allowed'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST'],
    },
    // Prefer WebSocket, fall back to long-polling automatically
    transports: ['websocket', 'polling'],
    // Prevent stale connections from accumulating
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Attach consultation chat socket handlers (isolated module — does not affect Express routes)
initConsultationSocket(io);

// Make io available to route handlers (used by startSession / endSession to emit events)
app.set('io', io);

// Health Check Endpoints - Defined AFTER CORS but BEFORE rate limiting
const getHealthStatus = () => {
    const isConnected = mongoose.connection.readyState === 1;
    return {
        status: isConnected ? 'ok' : 'degraded',
        database: isConnected ? 'connected' : 'disconnected',
        server: 'running'
    };
};

// Primary health check
app.get('/api/health', (req, res) => {
    res.status(200).json(getHealthStatus());
});

// Fallback for root-level pings
app.get('/health', (req, res) => {
    res.status(200).json(getHealthStatus());
});

// Security and Logging Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
})); // Set security headers with relaxed CSP for local dev
app.use(apiLimiter); // Apply global rate limiting to all requests
app.use(express.json({ limit: '2mb' })); // Body parser — increased limit for therapist application forms
app.use(xssSanitizer); // Data sanitization against XSS

// Routes
app.post('/api/chat', auth, chat);
app.get('/api/chat/history/:sessionId', auth, getHistory);
app.use('/api/auth', authRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/therapist-applications', therapistApplicationRoutes);

// Database Connection with Fallback
logger.info('MindWell: Attempting to connect to MongoDB...');
const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/mindwell";

const dbConnection = uri
    ? mongoose.connect(uri)
    : Promise.reject(new Error('MongoDB URI is not defined in .env file.'));

dbConnection
    .then(() => {
        logger.info('MindWell: Connected to MongoDB');
    })
    .catch((err) => {
        logger.error('MindWell: MongoDB connection error:', { message: err.message });
        logger.warn('MindWell: Falling back to In-Memory Storage.');
    })
    .finally(() => {
        const BIND_IP = '0.0.0.0';
        // Use httpServer.listen (not app.listen) so Socket.io shares the same port
        httpServer.listen(PORT, BIND_IP, () => {
            logger.info(`MindWell: Backend service listening on ${BIND_IP}:${PORT}`);
            logger.info(`MindWell: API Endpoint: http://localhost:${PORT}/api`);
            logger.info(`MindWell: Socket.io ready on ws://localhost:${PORT}`);

            // Log local network IPs for easier access during dev
            const nets = os.networkInterfaces();
            for (const name of Object.keys(nets)) {
                for (const net of nets[name]) {
                    if (net.family === 'IPv4' && !net.internal) {
                        logger.info(`MindWell: Accessible on network at http://${net.address}:${PORT}`);
                    }
                }
            }
        });
    });
