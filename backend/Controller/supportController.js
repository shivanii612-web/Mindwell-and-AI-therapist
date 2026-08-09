import { sendSupportEmail } from '../services/emailService.js';
import { queueEmergencyAlert } from '../services/notificationService.js';

export const contactSupport = async (req, res) => {
    try {
        const { subject, message, category } = req.body;
        const user = req.user; // From auth middleware

        if (!subject || !message || !category) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const emailDetails = {
            userName: user.full_name || 'MindWell User',
            userEmail: user.email,
            subject,
            message,
            category
        };

        // Queue the emergency alert job
        await queueEmergencyAlert(emailDetails);

        return res.status(200).json({
            message: 'Your message has been queued for MindWell support. Our team will review it immediately.'
        });
    } catch (error) {
        console.error('MindWell: Support contact controller error:', error);
        return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
    }
};
