import mongoose from 'mongoose';

const moodSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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

// Index for faster queries by user and date (non-unique to allow multiple entries per day)
moodSchema.index({ user_id: 1, logged_at: -1 }, { unique: false });

const Mood = mongoose.model('Mood', moodSchema);

export default Mood;
