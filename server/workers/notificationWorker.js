import { Worker } from 'bullmq';
import redisConnection from '../queue/redisConnection.js';
import { sendAppointmentRequestEmail, sendResetPasswordEmail, sendWelcomeEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';
import { QUEUE_JOB_TYPES } from '../queue/notificationQueue.js';
import { isRedisEnabled } from '../config/redis.js';

let worker = null;

if (isRedisEnabled) {
    worker = new Worker('notificationQueue', async (job) => {
        const { type, data } = job.data;
        const startTime = Date.now();

        logger.info(`Queue: Processing job ${job.id} of type ${type}`);

        try {
            switch (type) {
                case QUEUE_JOB_TYPES.EMAIL_EMERGENCY:
                    // Assuming we'll use a similar service to sendAppointmentRequestEmail for now
                    // or a dedicated emergency service if exists
                    await sendAppointmentRequestEmail(data);
                    break;

                case QUEUE_JOB_TYPES.EMAIL_APPOINTMENT_CONFIRMATION:
                    await sendAppointmentRequestEmail(data);
                    break;

                case QUEUE_JOB_TYPES.EMAIL_APPOINTMENT_REMINDER:
                    // Mock delay for reminder testing
                    logger.info(`Queue: Sending reminder for appointment ID: ${data.appointmentId}`);
                    await sendAppointmentRequestEmail(data);
                    break;

                case QUEUE_JOB_TYPES.EMAIL_PAYMENT_CONFIRMATION:
                    logger.info(`Queue: Processing payment confirmation for user: ${data.userEmail}`);
                    // Implementation for payment email
                    break;

                default:
                    logger.warn(`Queue: Unknown job type ${type}`);
            }

            const duration = Date.now() - startTime;
            logger.info(`Queue: Job ${job.id} completed successfully in ${duration}ms`);
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`Queue: Job ${job.id} failed after ${duration}ms`, { error: error.message });
            throw error; // Let BullMQ handle retries
        }
    }, {
        connection: redisConnection,
        concurrency: 5,
    });

    worker.on('failed', (job, err) => {
        logger.error(`Queue: Global job failure for ${job?.id}`, { error: err.message });
    });
}

export default worker;
