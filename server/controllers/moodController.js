import mongoose from 'mongoose';
import Mood from '../models/Mood.js';
import logger from '../utils/logger.js';
import { getCachedData, setCachedData, invalidatePattern } from '../utils/redisClient.js';

export const createMood = async (req, res) => {
    try {
        const { mood, mood_score, notes, triggers } = req.body;
        const userId = req.user._id;

        logger.info(`Mood save request received for user: ${userId}`, { mood, mood_score, triggers });

        if (!mood || !mood_score) {
            return res.status(400).json({ message: 'Mood and mood score are required' });
        }

        if (mongoose.connection.readyState !== 1) {
            logger.warn('Mood logging attempted while DB not connected. Command buffered by Mongoose.');
        }

        const newMood = new Mood({
            userId: userId, // Use standard field going forward
            mood: mood.toLowerCase(),
            mood_score: parseInt(mood_score),
            notes: notes || '',
            triggers: triggers || [],
            logged_at: new Date()
        });

        const savedMood = await newMood.save();
        logger.info(`Mood successfully saved to MongoDB for user: ${userId}, ID: ${savedMood._id}`);

        // Invalidate mood cache for this user
        await invalidatePattern(`moods:user:${userId}:*`);

        res.status(201).json(savedMood);
    } catch (err) {
        logger.error('Create mood error:', {
            error: err.message,
            stack: err.stack,
            userId: req.user?._id
        });
        res.status(500).json({
            message: 'Server error while logging mood',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

export const getMoods = async (req, res) => {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        const cacheKey = `moods:user:${userId}:limit:${limit}:offset:${offset}`;
        const cachedMoods = await getCachedData(cacheKey);

        if (cachedMoods) {
            logger.info(`Redis: Cache hit for user moods: ${userId}`);
            return res.json(cachedMoods);
        }

        // Search across both userId and user_id for backward compatibility
        const query = {
            $or: [
                { userId: userId },
                { user_id: userId }
            ]
        };

        const moods = await Mood.find(query)
            .sort({ logged_at: -1 })
            .skip(offset)
            .limit(limit);

        // Cache the result for 1 hour
        await setCachedData(cacheKey, moods, 3600);

        res.json(moods);
    } catch (err) {
        logger.error('Get moods error:', err);
        res.status(500).json({ message: 'Server error while fetching moods' });
    }
};
