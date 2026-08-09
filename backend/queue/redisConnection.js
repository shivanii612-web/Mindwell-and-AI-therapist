/**
 * server/queue/redisConnection.js
 *
 * Dedicated IORedis connection for BullMQ.
 * BullMQ requires a separate connection from the cache client.
 *
 * Returns null when Redis is disabled — all queue code checks for null
 * and skips gracefully.
 */

import IORedis from 'ioredis';
import logger from '../Utils/logger.js';
import { isRedisEnabled } from '../Config/redis.js';

let redisConnection = null;

if (isRedisEnabled) {
    if (!global._redisConnection) {
        // Prefer REDIS_URL, fall back to host/port
        const redisUrl = process.env.REDIS_URL;
        const connectionConfig = redisUrl
            ? redisUrl
            : {
                  host: process.env.REDIS_HOST || '127.0.0.1',
                  port: parseInt(process.env.REDIS_PORT) || 6379,
                  password: process.env.REDIS_PASSWORD || undefined,
              };

        try {
            const connection = new IORedis(connectionConfig, {
                maxRetriesPerRequest: null, // Required by BullMQ
                enableOfflineQueue: false,
                lazyConnect: true,
                retryStrategy: (times) => {
                    return Math.min(times * 500, 5000);
                },
            });

            connection.connect().catch((_err) => {
                // Intentionally swallowed — error event on redisConnection handles logging
            });

            let hasLoggedError = false;

            connection.on('connect', () => {
                hasLoggedError = false;
            });

            connection.on('ready', () => {
                hasLoggedError = false;
            });

            connection.on('error', (err) => {
                if (!hasLoggedError) {
                    logger.warn('MindWell: BullMQ Redis unavailable — queues disabled');
                    hasLoggedError = true;
                }
            });

            global._redisConnection = connection;
        } catch (err) {
            logger.warn('MindWell: BullMQ Redis init failed — queues disabled', { error: err.message });
        }
    }
    redisConnection = global._redisConnection || null;
}

export default redisConnection;
