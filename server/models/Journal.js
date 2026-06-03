import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    mood: {
        type: String,
        required: true
    },
    mood_score: {
        type: Number,
        default: 5
    },
    tags: [{
        type: String,
        trim: true
    }],
    is_private: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

journalSchema.index({ user_id: 1, createdAt: -1 });

const Journal = mongoose.model('Journal', journalSchema);
export default Journal;
