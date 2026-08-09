//Controlled by REDIS_ENABLED=true|false in server/.env
//Connection: REDIS_URL=redis://localhost:6379 (or REDIS_HOST + REDIS_PORT)


import IORedis from 'ioredis';
import logger from '../Utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

export const isRedisEnabled = process.env.REDIS_ENABLED === 'true';

let redisClient = null;

if (isRedisEnabled) {
    if (!global._redisClient) {
        // Prefer REDIS_URL (standard), fall back to host/port env vars
        const redisUrl = process.env.REDIS_URL;
        const redisConfig = redisUrl
            ? redisUrl
            : {
                host: process.env.REDIS_HOST || '127.0.0.1',
                port: parseInt(process.env.REDIS_PORT) || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
            };

        try {
            const client = new IORedis(redisConfig, {
                // Keep retrying in the background using a back-off strategy up to 5 seconds
                retryStrategy: (times) => {
                    return Math.min(times * 500, 5000);
                },
                // Required by BullMQ — do not limit requests per connection
                maxRetriesPerRequest: null,
                // Do not block the event loop on connection issues
                enableOfflineQueue: false,
                lazyConnect: true, // connect explicitly so startup is never blocked
            });

            // Connect in the background — failure is non-fatal.
            // The .catch() suppresses the unhandled rejection warning.
            // The 'error' event on the client handles logging.
            client.connect().catch((_err) => {
                // Intentionally swallowed — 'error' event on redisClient logs the warning
            });

            let hasLoggedError = false;

            client.on('connect', () => {
                logger.info('MindWell: Redis connected');
                hasLoggedError = false;
            });

            client.on('ready', () => {
                logger.info('MindWell: Redis ready — cache and queues active');
                hasLoggedError = false;
            });

            client.on('error', (err) => {
                if (!hasLoggedError) {
                    logger.warn('MindWell: Redis unavailable — running without cache');
                    hasLoggedError = true;
                }
            });

            client.on('end', () => {
                logger.warn('MindWell: Redis connection closed — running without cache');
            });

            global._redisClient = client;
        } catch (err) {
            logger.warn('MindWell: ⚠️  Redis init failed — running without cache', { error: err.message });
        }
    }
    redisClient = global._redisClient || null;
} else {
    logger.info('MindWell: Redis disabled (REDIS_ENABLED=false) — running without cache');
}

export default redisClient;
