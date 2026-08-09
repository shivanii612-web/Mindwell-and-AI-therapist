import express from 'express';
import { createMood, getMoods } from '../Controller/moodController.js';
import { auth } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.use(auth); // All mood routes protected

router.post('/', createMood);
router.get('/', getMoods);

export default router;
