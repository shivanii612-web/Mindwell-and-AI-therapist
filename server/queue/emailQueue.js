/**
 * server/queue/emailQueue.js
 *
 * Dedicated BullMQ queue for outgoing emails.
 * Separate from notificationQueue so email jobs can have
 * independent retry/priority settings.
 *
 * Returns null when Redis is disabled — callers must check
 * before enqueuing. All failures are non-fatal.
 */

import { Queue } from 'bullmq';
import redisConnection from './redisConnection.js';
import { isRedisEnabled } from '../config/redis.js';
import logger from '../utils/logger.js';

export const EMAIL_JOB_TYPES = {
    WELCOME:              'EMAIL_WELCOME',
    THERAPIST_APPROVED:   'EMAIL_THERAPIST_APPROVED',
    THERAPIST_REJECTED:   'EMAIL_THERAPIST_REJECTED',
    APPOINTMENT_CONFIRM:  'EMAIL_APPOINTMENT_CONFIRM',
    APPOINTMENT_REMINDER: 'EMAIL_APPOINTMENT_REMINDER',
    PAYMENT_RECEIPT:      'EMAIL_PAYMENT_RECEIPT',
    PASSWORD_RESET:       'EMAIL_PASSWORD_RESET',
};

// Queue is null when Redis is unavailable — all enqueue helpers handle this safely
export const emailQueue = (isRedisEnabled && redisConnection)
    ? new Queue('emailQueue', {
          connection: redisConnection,
          defaultJobOptions: {
              attempts: 3,
              backoff: { type: 'exponential', delay: 2000 },
              removeOnComplete: { count: 100 },  // keep last 100 completed jobs for inspection
              removeOnFail:     { count: 200 },  // keep last 200 failed jobs for debugging
          },
      })
    : null;

if (emailQueue) {
    logger.info('MindWell: emailQueue initialized');
} else {
    logger.info('MindWell: emailQueue skipped (Redis disabled)');
}

/**
 * enqueueEmail — safely enqueue an email job.
 * Returns the job object if enqueued, null if Redis is unavailable.
 * Never throws — a missing email queue must never crash the app.
 */
export const enqueueEmail = async (type, data, options = {}) => {
    if (!emailQueue) return null;
    try {
        const job = await emailQueue.add(type, { type, data }, options);
        logger.info(`MindWell: Email job enqueued — type=${type} jobId=${job.id}`);
        return job;
    } catch (err) {
        logger.warn(`MindWell: Failed to enqueue email (non-fatal) — type=${type}`, { error: err.message });
        return null;
    }
};

// ── Convenience helpers ──────────────────────────────────────────────────────

export const enqueueWelcomeEmail = (data) =>
    enqueueEmail(EMAIL_JOB_TYPES.WELCOME, data);

export const enqueueTherapistApprovedEmail = (data) =>
    enqueueEmail(EMAIL_JOB_TYPES.THERAPIST_APPROVED, data);

export const enqueueTherapistRejectedEmail = (data) =>
    enqueueEmail(EMAIL_JOB_TYPES.THERAPIST_REJECTED, data);

export const enqueueAppointmentConfirmEmail = (data) =>
    enqueueEmail(EMAIL_JOB_TYPES.APPOINTMENT_CONFIRM, data);

export const enqueuePaymentReceiptEmail = (data) =>
    enqueueEmail(EMAIL_JOB_TYPES.PAYMENT_RECEIPT, data);
