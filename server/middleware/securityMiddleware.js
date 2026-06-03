import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';

// Global API rate limiting
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
    skip: (req) => {
        const ip = req.ip || req.connection.remoteAddress;
        return ip === '127.0.0.1' || ip === '::1' || ip.includes('127.0.0.1') || ip.includes('::ffff:127.0.0.1');
    }, // Skip local testing
});

// XSS Sanitization middleware
export const xssSanitizer = xss();
