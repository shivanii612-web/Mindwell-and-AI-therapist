import express from 'express';
import { getPosts, createPost, toggleLike, addComment, getComments } from '../controllers/communityController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/posts', auth, getPosts);
router.post('/posts', auth, createPost);
router.post('/posts/:id/like', auth, toggleLike);
router.post('/posts/:id/comment', auth, addComment);
router.get('/posts/:postId/comments', auth, getComments);

export default router;
