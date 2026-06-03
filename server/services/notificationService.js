import { notificationQueue, QUEUE_JOB_TYPES } from '../queue/notificationQueue.js';
import logger from '../utils/logger.js';

export const queueNotification = async (type, data, options = {}) => {
    try {
        if (!notificationQueue) {
            logger.warn('Queue: notificationQueue not initialized. Falling back to immediate execution (if possible) or failing gracefully.');
            return null;
        }

        const job = await notificationQueue.add(type, { type, data }, options);
        logger.info(`Queue: Job added to notificationQueue`, { jobId: job.id, type });
        return job;
    } catch (error) {
        logger.error('Queue: Error adding job to notificationQueue', { error: error.message, type });
        return null;
    }
};

export const queueEmergencyAlert = (data) => {
    return queueNotification(QUEUE_JOB_TYPES.EMAIL_EMERGENCY, data, { priority: 1 });
};

export const queueAppointmentConfirmation = (data) => {
    return queueNotification(QUEUE_JOB_TYPES.EMAIL_APPOINTMENT_CONFIRMATION, data);
};

export const queueAppointmentReminder = (data, delayMs) => {
    return queueNotification(QUEUE_JOB_TYPES.EMAIL_APPOINTMENT_REMINDER, data, { delay: delayMs });
};

export const queuePaymentConfirmation = (data) => {
    return queueNotification(QUEUE_JOB_TYPES.EMAIL_PAYMENT_CONFIRMATION, data);
};
