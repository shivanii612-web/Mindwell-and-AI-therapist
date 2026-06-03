import Redis from 'ioredis';
import logger from './logger.js';

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
};

let redisClient = null;

try {
    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
        logger.info('Redis: Connection established');
    });

    redisClient.on('error', (err) => {
        logger.error('Redis: Connection error', { error: err.message });
    });

    redisClient.on('end', () => {
        logger.warn('Redis: Connection closed');
    });
} catch (error) {
    logger.error('Redis: Initialization failed', { error: error.message });
}

export const getCachedData = async (key) => {
    if (!redisClient || redisClient.status !== 'ready') return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        logger.error('Redis: Get error', { key, error: error.message });
        return null;
    }
};

export const setCachedData = async (key, data, ttlSeconds = 3600) => {
    if (!redisClient || redisClient.status !== 'ready') return;
    try {
        const stringifiedData = JSON.stringify(data);
        await redisClient.set(key, stringifiedData, 'EX', ttlSeconds);
    } catch (error) {
        logger.error('Redis: Set error', { key, error: error.message });
    }
};

export const deleteCachedData = async (key) => {
    if (!redisClient || redisClient.status !== 'ready') return;
    try {
        await redisClient.del(key);
    } catch (error) {
        logger.error('Redis: Delete error', { key, error: error.message });
    }
};

export const invalidatePattern = async (pattern) => {
    if (!redisClient || redisClient.status !== 'ready') return;
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(...keys);
            logger.info(`Redis: Invalidated ${keys.length} keys for pattern ${pattern}`);
        }
    } catch (error) {
        logger.error('Redis: Pattern invalidation error', { pattern, error: error.message });
    }
};

export default redisClient;
