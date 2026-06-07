/**
 * worker-entry.js
 * Standalone entry point for the BullMQ notification worker container.
 * Used by: docker-compose worker service
 * Run: node worker-entry.js
 */
import './workers/notificationWorker.js';
import logger from './utils/logger.js';

logger.info('MindWell Worker: Notification worker process started');

// Keep process alive — BullMQ Worker manages its own event loop
process.on('SIGTERM', () => {
    logger.info('MindWell Worker: SIGTERM received — shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger.info('MindWell Worker: SIGINT received — shutting down gracefully');
    process.exit(0);
});
