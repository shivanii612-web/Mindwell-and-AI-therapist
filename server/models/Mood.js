import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // Moving to userId standard, user_id made optional for legacy support
        required: false,
    },
    mood: {
        type: String,
        required: true,
        lowercase: true,
    },
    mood_score: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
    },
    notes: {
        type: String,
        trim: true,
    },
    triggers: {
        type: [String],
        default: [],
    },
    logged_at: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

// Indices for faster queries by user and date
moodSchema.index({ userId: 1, logged_at: -1 });
moodSchema.index({ user_id: 1, logged_at: -1 });

const Mood = mongoose.model('Mood', moodSchema);

export default Mood;
