import CommunityPost from '../models/CommunityPost.js';
import CommunityComment from '../models/CommunityComment.js';
import User from '../models/User.js';
import { getCachedData, setCachedData, invalidatePattern } from '../utils/redisClient.js';

// Basic safety check for crisis content
const containsCrisisContent = (text) => {
    const crisisKeywords = [
        'suicide', 'kill myself', 'end my life', 'self-harm', 'cut myself',
        'better off dead', 'don\'t want to live', 'thinking of end'
    ];
    const lowerText = text.toLowerCase();
    return crisisKeywords.some(keyword => lowerText.includes(keyword));
};

const SAFETY_MESSAGE = "This sounds serious. Please use emergency support or talk to someone you trust immediately.";

export const getPosts = async (req, res) => {
    try {
        const { category } = req.query;
        const cacheKey = `community:posts:cat:${category || 'all'}`;

        const cachedPosts = await getCachedData(cacheKey);
        if (cachedPosts) {
            return res.status(200).json(cachedPosts);
        }

        let query = {};
        if (category && category !== 'all') {
            query.category = category;
        }

        const posts = await CommunityPost.find(query)
            .populate('userId', 'full_name avatar_url')
            .sort({ created_at: -1 });

        // Transform for frontend
        const transformedPosts = posts.map(post => {
            const postObj = post.toObject();
            return {
                id: postObj._id,
                ...postObj,
                likes_count: postObj.likes?.length || 0,
                comments_count: postObj.comments?.length || 0,
                profiles: postObj.is_anonymous ? null : postObj.userId
            };
        });

        await setCachedData(cacheKey, transformedPosts, 1800); // Cache for 30 mins
        res.status(200).json(transformedPosts);
    } catch (error) {
        console.error('MindWell: Error fetching community posts:', error);
        res.status(500).json({ message: 'Error fetching community posts' });
    }
};

export const createPost = async (req, res) => {
    try {
        const { title, content, category, is_anonymous } = req.body;
        const userId = req.user._id; // Use _id — Mongoose documents expose ._id, not .id

        if (!title.trim() || !content.trim()) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        // Safety Moderation
        if (containsCrisisContent(title) || containsCrisisContent(content)) {
            console.warn('MindWell: Crisis content detected and blocked in post');
            return res.status(403).json({
                message: SAFETY_MESSAGE,
                is_safety_violation: true
            });
        }

        const newPost = new CommunityPost({
            userId,
            title,
            content,
            category,
            is_anonymous
        });

        await newPost.save();

        // Invalidate all community post caches
        await invalidatePattern('community:posts:*');

        console.log('MindWell: New community post created:', newPost._id);
        res.status(201).json(newPost);
    } catch (error) {
        console.error('MindWell: Error creating community post:', error);
        res.status(500).json({ message: 'Error creating community post' });
    }
};

export const toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id; // Use _id — consistent with auth middleware

        const post = await CommunityPost.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const likeIndex = post.likes.indexOf(userId.toString());
        if (likeIndex === -1) {
            // Like
            post.likes.push(userId);
        } else {
            // Unlike
            post.likes.splice(likeIndex, 1);
        }

        await post.save();

        // Invalidate caches
        await invalidatePattern('community:posts:*');
        await invalidatePattern(`community:comments:${id}`);

        res.status(200).json({
            id: post._id,
            likes_count: post.likes.length,
            is_liked: post.likes.map(l => l.toString()).includes(userId.toString())
        });
    } catch (error) {
        console.error('MindWell: Error toggling like:', error);
        res.status(500).json({ message: 'Error toggling like' });
    }
};

export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;
        const userId = req.user._id; // Use _id — consistent with auth middleware
        const user = await User.findById(userId);

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        // Safety Moderation
        if (containsCrisisContent(text)) {
            console.warn('MindWell: Crisis content detected and blocked in comment');
            return res.status(403).json({
                message: SAFETY_MESSAGE,
                is_safety_violation: true
            });
        }

        const post = await CommunityPost.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = {
            user_id: userId,
            username: user?.full_name || 'Anonymous User',
            text: text.trim(),
            createdAt: new Date()
        };

        post.comments.push(newComment);
        await post.save();

        // Invalidate caches
        await invalidatePattern('community:posts:*');
        await invalidatePattern(`community:comments:${id}`);

        console.log('MindWell: New community comment added to post:', id);
        res.status(201).json(post.comments[post.comments.length - 1]);
    } catch (error) {
        console.error('MindWell: Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment' });
    }
};

export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const cacheKey = `community:comments:${postId}`;

        const cachedComments = await getCachedData(cacheKey);
        if (cachedComments) {
            return res.status(200).json(cachedComments);
        }

        const post = await CommunityPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        await setCachedData(cacheKey, post.comments, 1800);
        res.status(200).json(post.comments);
    } catch (error) {
        console.error('MindWell: Error fetching comments:', error);
        res.status(500).json({ message: 'Error fetching comments' });
    }
};
