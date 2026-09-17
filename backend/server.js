import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import os from 'os';
import { apiLimiter, xssSanitizer } from './Middleware/securityMiddleware.js';
import logger from './Utils/logger.js';
import { chat, getHistory } from './Controller/chatController.js';
import redisClient, { isRedisEnabled } from './Config/redis.js'; // Initialize Redis connection
import authRoutes from './Routes/authRoutes.js';
import journalRoutes from './Routes/journalRoutes.js';
import appointmentRoutes from './Routes/appointmentRoutes.js';
import communityRoutes from './Routes/communityRoutes.js';
import supportRoutes from './Routes/supportRoutes.js';
import moodRoutes from './Routes/moodRoutes.js';
import paymentRoutes from './Routes/paymentRoutes.js';
import consultationRoutes from './Routes/consultationRoutes.js';
import therapistApplicationRoutes from './Routes/therapistApplicationRoutes.js';
import { auth } from './Middleware/authMiddleware.js';
import { initConsultationSocket } from './socket/consultationSocket.js';

dotenv.config();

const app = express();
// Wrap Express in a plain Node http.Server so Socket.io can share the same port.
// Nothing else changes — app.listen below still binds to PORT as before.
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    "https://mindwell-and-ai-therapist.vercel.app",
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

        // Dynamic allowed origins for development, local network, and deployed frontend
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('[::1]');
        const isPrivateIP = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);
        const isAllowedSubdomain = /\.mindwellhealth\.ai$/.test(origin);
        const isVercel = origin.endsWith('.vercel.app') || origin.includes('vercel.app') || allowedOrigins.includes(origin);

        if (isLocalhost || isPrivateIP || isAllowedSubdomain || isVercel) {
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
            const isVercel = origin.endsWith('.vercel.app') || origin.includes('vercel.app') || allowedOrigins.includes(origin);
            if (isLocalhost || isPrivateIP || isAllowedSubdomain || isVercel) {
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
    const redisStatus = isRedisEnabled
        ? (redisClient && redisClient.status === 'ready' ? 'connected' : 'failed')
        : 'disabled';
    return {
        status: isConnected ? 'ok' : 'degraded',
        database: isConnected ? 'connected' : 'disconnected',
        redis: redisStatus,
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
// CSP is set to permissive defaults that allow the existing frontend/backend setup
// while still providing the header (satisfies CodeQL alert #24).
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
            fontSrc: ["'self'", 'data:', 'https:'],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'", 'blob:'],
            frameSrc: ["'self'", 'https:'],
        },
    },
}));
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

// Database Connection with Retry and Auto-Reconnection
const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/mindwell";

const connectMongo = async () => {
    if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
        return;
    }
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000,
        });
    } catch (err) {
        logger.error('MindWell: MongoDB connection error:', { message: err.message });
    }
};

if (!global._mongoInitialized) {
    global._mongoInitialized = true;
    mongoose.connection.on('connected', () => {
        logger.info('MindWell: MongoDB connected');
    });
    mongoose.connection.on('error', (err) => {
        logger.error('MindWell: MongoDB connection error:', { message: err.message });
    });
    mongoose.connection.on('disconnected', () => {
        logger.warn('MindWell: MongoDB disconnected. Reconnection will be attempted.');
    });
}

connectMongo().finally(() => {
    const BIND_IP = '0.0.0.0';
    if (!global._serverListening) {
        global._serverListening = true;
        // Use httpServer.listen (not app.listen) so Socket.io shares the same port
        httpServer.listen(PORT, BIND_IP, () => {
            logger.info(`MindWell: Backend running on port ${PORT}`);
            logger.info('MindWell: Socket.IO ready');
        });
    }
});

// Periodic reconnect attempt if database gets disconnected
setInterval(() => {
    if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
        connectMongo();
    }
}, 10000);
