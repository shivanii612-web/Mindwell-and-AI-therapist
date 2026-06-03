import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { queueAppointmentConfirmation, queueAppointmentReminder } from '../services/notificationService.js';
import { getCachedData, setCachedData, deleteCachedData } from '../utils/redisClient.js';
import logger from '../utils/logger.js';

export const createAppointment = async (req, res) => {
    console.log('MindWell: Appointment Request Body:', req.body);
    try {
        const { sessionType, preferredDate, preferredTime, reason, notes } = req.body;
        const userId = req.user.id;

        // Fetch user details for the email
        const user = await User.findById(userId);
        if (!user) {
            console.error('MindWell: User not found for ID:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        const newAppointment = new Appointment({
            userId,
            sessionType,
            preferredDate,
            preferredTime,
            reason,
            notes,
            status: 'Pending Review'
        });

        await newAppointment.save();
        console.log('MindWell: Appointment saved to MongoDB:', newAppointment._id);

        // Invalidate appointments cache for this user
        await deleteCachedData(`appointments:user:${userId}`);

        // Queue appointment confirmation notification
        const emailData = {
            userName: user.full_name || user.email.split('@')[0],
            userEmail: user.email,
            sessionType,
            preferredDate: new Date(preferredDate).toDateString(),
            preferredTime,
            reason,
            notes
        };

        await queueAppointmentConfirmation(emailData);

        // Queue a mock reminder for 24 hours before (or just delayed by 1 hour for demo if date is soon)
        const appointmentDate = new Date(preferredDate);
        const reminderTime = new Date(appointmentDate.getTime() - (24 * 60 * 60 * 1000));
        const now = new Date();

        let delay = reminderTime.getTime() - now.getTime();
        if (delay < 0) delay = 1000 * 60 * 5; // If less than 24h away, send in 5 mins for testing

        await queueAppointmentReminder({
            ...emailData,
            isReminder: true,
            appointmentId: newAppointment._id
        }, delay);

        console.log('MindWell: Appointment notifications queued for background processing');

        res.status(201).json(newAppointment);
    } catch (error) {
        console.error('MindWell: Error creating appointment:', error);
        res.status(500).json({ message: error.message || 'Internal server error during appointment creation' });
    }
};

export const getAppointments = async (req, res) => {
    try {
        const userId = req.user.id;
        const cacheKey = `appointments:user:${userId}`;

        const cachedAppointments = await getCachedData(cacheKey);
        if (cachedAppointments) {
            logger.info(`Redis: Cache hit for user appointments: ${userId}`);
            return res.status(200).json(cachedAppointments);
        }

        const appointments = await Appointment.find({ userId }).sort({ createdAt: -1 });

        // Cache for 1 hour
        await setCachedData(cacheKey, appointments, 3600);

        res.status(200).json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
