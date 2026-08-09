import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    is_read: {
        type: Boolean,
        default: false
    },
    isRead: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

notificationSchema.pre('save', function(next) {
    if (this.userId && !this.user_id) {
        this.user_id = this.userId;
    } else if (this.user_id && !this.userId) {
        this.userId = this.user_id;
    }
    if (this.is_read !== this.isRead) {
        this.isRead = this.is_read;
    }
    next();
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
