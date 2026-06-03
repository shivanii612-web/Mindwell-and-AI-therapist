import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema({
    userId: {
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
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['general', 'anxiety', 'depression', 'relationships', 'self-care'],
        default: 'general'
    },
    is_anonymous: {
        type: Boolean,
        default: false
    },
    is_pinned: {
        type: Boolean,
        default: false
    },
    likes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    comments: [{
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        username: String,
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
});

communityPostSchema.index({ category: 1, createdAt: -1 });

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);
export default CommunityPost;
