import winston from 'winston';
import mongoose from 'mongoose';

let hasLoggedMongoError = false;

const mongoSanitizer = winston.format((info) => {
    // Check if MongoDB is not connected
    const isMongoConnected = mongoose.connection && mongoose.connection.readyState === 1;

    // Check if the log contains MongoDB-related errors or keywords
    const isMongoRelated = 
        (info.message && (
            info.message.includes('Mongo') || 
            info.message.includes('mongo') || 
            info.message.includes('ENOTFOUND') || 
            info.message.includes('Mongoose') ||
            info.message.includes('mongoose') ||
            info.message.includes('Topology') ||
            info.message.includes('getaddrinfo')
        )) ||
        (info.stack && (
            info.stack.includes('Mongo') || 
            info.stack.includes('mongo') || 
            info.stack.includes('ENOTFOUND') || 
            info.stack.includes('Mongoose') ||
            info.stack.includes('mongoose') ||
            info.stack.includes('getaddrinfo')
        ));

    if (isMongoRelated) {
        if (!isMongoConnected) {
            if (!hasLoggedMongoError) {
                hasLoggedMongoError = true;
                info.message = 'MindWell: MongoDB unavailable — retrying connection';
                delete info.stack;
                delete info.error;
                return info;
            } else {
                // Suppress repeated database-related errors
                return false;
            }
        } else {
            hasLoggedMongoError = false;
        }
    }

    if (isMongoConnected) {
        hasLoggedMongoError = false;
    }

    // Generic sanitization to prevent sensitive data, local paths, and credentials leaking in any log
    const sanitize = (val) => {
        if (typeof val !== 'string') return val;
        
        let sanitized = val;
        // Hide MongoDB URI / connection strings
        sanitized = sanitized.replace(/mongodb\+srv:\/\/[^\s"'`>]+/gi, 'mongodb+srv://[redacted]');
        sanitized = sanitized.replace(/mongodb:\/\/[^\s"'`>]+/gi, 'mongodb://[redacted]');
        
        // Hide credentials pattern (e.g. username:password@host)
        sanitized = sanitized.replace(/([a-zA-Z0-9._%+-]+):([a-zA-Z0-9._%+-]+)@/g, '[credentials]@');

        // Hide local Windows filesystem paths
        sanitized = sanitized.replace(/[a-zA-Z]:\\[\\\w\s\d.-]+/g, '[path]');
        // Hide UNIX absolute paths
        sanitized = sanitized.replace(/\b\/(?:[a-zA-Z0-9._-]+\/)+[a-zA-Z0-9._-]+\b/g, '[path]');

        // Redact potential secrets/keys if found in string
        sanitized = sanitized.replace(/JWT_SECRET\s*=\s*[^\s]+/gi, 'JWT_SECRET=[redacted]');
        sanitized = sanitized.replace(/REDIS_PASSWORD\s*=\s*[^\s]+/gi, 'REDIS_PASSWORD=[redacted]');

        return sanitized;
    };

    if (info.message) info.message = sanitize(info.message);
    if (info.stack) info.stack = sanitize(info.stack);
    if (info.error && typeof info.error === 'string') info.error = sanitize(info.error);

    for (const key of Object.keys(info)) {
        if (typeof info[key] === 'string') {
            info[key] = sanitize(info[key]);
        }
    }

    return info;
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        mongoSanitizer(),
        winston.format.json()
    ),
    defaultMeta: { service: 'mindwell-service', version: '1.0.0' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            mongoSanitizer(),
            winston.format.simple()
        ),
    }));
}

export default logger;
