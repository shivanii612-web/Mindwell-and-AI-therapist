import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { apiLimiter, xssSanitizer } from './middleware/securityMiddleware.js';
import logger from './utils/logger.js';
import { chat, getHistory } from './controllers/chatController.js';
import './utils/redisClient.js'; // Initialize Redis connection
import authRoutes from './routes/authRoutes.js';
import journalRoutes from './routes/journalRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import moodRoutes from './routes/moodRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and Logging Middleware
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
})); // Set security headers with relaxed CSP for local dev
app.use(apiLimiter); // Apply global rate limiting to all requests
app.use(express.json({ limit: '10kb' })); // Body parser with payload limit
app.use(xssSanitizer); // Data sanitization against XSS

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

        // Dynamic allowed origins for development
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isPrivateIP = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin);

        if (isLocalhost || isPrivateIP) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

// Routes
app.post('/api/chat', chat);
app.get('/api/chat/history/:sessionId', getHistory);
app.use('/api/auth', authRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/payments', paymentRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'in-memory-fallback'
    });
});

// Database Connection with Fallback
logger.info('MindWell: Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
    .then(() => {
        logger.info('MindWell: Connected to MongoDB');
    })
    .catch((err) => {
        logger.error('MindWell: MongoDB connection error:', { message: err.message });
        logger.warn('MindWell: Falling back to In-Memory Storage.');
    })
    .finally(() => {
        app.listen(PORT, '0.0.0.0', () => {
            logger.info(`MindWell: Server running on http://0.0.0.0:${PORT}`);
            logger.info(`MindWell: Local Network Access: http://192.168.137.1:${PORT}`);
        });
    });
