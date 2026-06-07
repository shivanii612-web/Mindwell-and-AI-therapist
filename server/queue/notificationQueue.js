import { Queue } from 'bullmq';
import redisConnection from './redisConnection.js';
import { isRedisEnabled } from '../config/redis.js';

export const notificationQueue = isRedisEnabled ? new Queue('notificationQueue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
}) : null;

export const QUEUE_JOB_TYPES = {
    EMAIL_EMERGENCY: 'EMAIL_EMERGENCY',
    EMAIL_APPOINTMENT_CONFIRMATION: 'EMAIL_APPOINTMENT_CONFIRMATION',
    EMAIL_APPOINTMENT_REMINDER: 'EMAIL_APPOINTMENT_REMINDER',
    EMAIL_PAYMENT_CONFIRMATION: 'EMAIL_PAYMENT_CONFIRMATION',
    EMAIL_SUBSCRIPTION_EXPIRY: 'EMAIL_SUBSCRIPTION_EXPIRY',
};
