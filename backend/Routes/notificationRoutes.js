import express from 'express';
import { auth } from '../Middleware/authMiddleware.js';
import Notification from '../Models/Notification.js';

const router = express.Router();

router.use(auth);

// GET /api/notifications
router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error('MindWell: Failed to fetch notifications:', error);
        res.status(500).json({ message: 'Failed to fetch notifications' });
    }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            {
                _id: req.params.id,
                $or: [
                    { userId: req.user._id },
                    { user_id: req.user._id }
                ]
            },
            { $set: { is_read: true, isRead: true } },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        console.error('MindWell: Failed to mark notification as read:', error);
        res.status(500).json({ message: 'Failed to update notification' });
    }
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', async (req, res) => {
    try {
        await Notification.updateMany(
            {
                $or: [
                    { userId: req.user._id },
                    { user_id: req.user._id }
                ],
                is_read: false
            },
            { $set: { is_read: true, isRead: true } }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('MindWell: Failed to mark all notifications as read:', error);
        res.status(500).json({ message: 'Failed to update notifications' });
    }
});

// DELETE /api/notifications
router.delete('/', async (req, res) => {
    try {
        await Notification.deleteMany({
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        });
        res.json({ message: 'Notifications cleared' });
    } catch (error) {
        console.error('MindWell: Failed to clear notifications:', error);
        res.status(500).json({ message: 'Failed to clear notifications' });
    }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            $or: [
                { userId: req.user._id },
                { user_id: req.user._id }
            ]
        });
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('MindWell: Failed to delete notification:', error);
        res.status(500).json({ message: 'Failed to delete notification' });
    }
});

export default router;
