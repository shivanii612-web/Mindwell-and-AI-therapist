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
import logger from '../utils/logger.js';
import { isRedisEnabled } from '../config/redis.js';

let redisConnection = null;

if (isRedisEnabled) {
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
        redisConnection = new IORedis(connectionConfig, {
            maxRetriesPerRequest: null, // Required by BullMQ
            enableOfflineQueue: false,
            lazyConnect: true,
            retryStrategy: (times) => {
                if (times > 3) return null;
                return Math.min(times * 200, 1000);
            },
        });

        redisConnection.connect().catch(() => {
            // Silenced — error event handles logging
        });

        redisConnection.on('error', (err) => {
            logger.warn('MindWell: BullMQ Redis unavailable — queues disabled', { error: err.message });
        });

    } catch (err) {
        logger.warn('MindWell: BullMQ Redis init failed — queues disabled', { error: err.message });
        redisConnection = null;
    }
}

export default redisConnection;
