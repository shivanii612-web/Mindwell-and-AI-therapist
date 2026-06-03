import express from 'express';
import {
    register,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    getMe,
    changePassword
} from '../controllers/authController.js';
import { auth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePassword);

export default router;
