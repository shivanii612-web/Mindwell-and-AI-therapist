/**
 * server/config/redis.js
 *
 * Optional Redis connection for MindWell.
 *
 * Controlled by REDIS_ENABLED=true|false in server/.env
 * Connection: REDIS_URL=redis://localhost:6379 (or REDIS_HOST + REDIS_PORT)
 *
 * SAFETY GUARANTEE:
 *   When REDIS_ENABLED=false OR Redis is unreachable:
 *   - redisClient is null
 *   - isRedisEnabled is false
 *   - All callers (redisClient.js, queue/redisConnection.js) check this flag
 *     before using Redis and silently skip — the app continues normally.
 */

import IORedis from 'ioredis';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

export const isRedisEnabled = process.env.REDIS_ENABLED === 'true';

let redisClient = null;

if (isRedisEnabled) {
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
        redisClient = new IORedis(redisConfig, {
            // Retry with back-off; give up after 3 attempts to avoid blocking startup
            retryStrategy: (times) => {
                if (times > 3) {
                    // Stop retrying — Redis is genuinely unavailable locally
                    return null; // null = stop retrying
                }
                return Math.min(times * 200, 1000); // ms delay between retries
            },
            // Required by BullMQ — do not limit requests per connection
            maxRetriesPerRequest: null,
            // Do not block the event loop on connection issues
            enableOfflineQueue: false,
            lazyConnect: true, // connect explicitly so startup is never blocked
        });

        // Connect in the background — failure is non-fatal
        redisClient.connect().catch(() => {
            // connect() rejection is silenced here; the 'error' event handles logging
        });

        redisClient.on('connect', () => {
            logger.info('MindWell: ✅ Redis connected');
        });

        redisClient.on('ready', () => {
            logger.info('MindWell: Redis ready — cache and queues active');
        });

        redisClient.on('error', (err) => {
            if (err.code === 'ECONNREFUSED') {
                logger.warn('MindWell: ⚠️  Redis unavailable — running without cache (ECONNREFUSED)');
            } else {
                logger.warn('MindWell: ⚠️  Redis unavailable — running without cache', { error: err.message });
            }
        });

        redisClient.on('end', () => {
            logger.warn('MindWell: Redis connection closed — running without cache');
        });

    } catch (err) {
        logger.warn('MindWell: ⚠️  Redis init failed — running without cache', { error: err.message });
        redisClient = null;
    }
} else {
    logger.info('MindWell: Redis disabled (REDIS_ENABLED=false) — running without cache');
}

export default redisClient;
