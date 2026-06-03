import IORedis from 'ioredis';
import logger from '../utils/logger.js';

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null, // Required for BullMQ
};

const redisConnection = new IORedis(redisConfig);

redisConnection.on('error', (error) => {
    logger.error('BullMQ: Redis connection error', { error: error.message });
});

export default redisConnection;
