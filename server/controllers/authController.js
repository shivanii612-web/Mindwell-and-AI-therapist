import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendResetPasswordEmail, sendWelcomeEmail } from '../services/emailService.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mindwell-secure-secret-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'mindwell-refresh-secret-2024';

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1d' }); // Increased for stability
    const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

export const register = async (req, res) => {
    const { email, password, full_name, username } = req.body;

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username: username || null }] });
        if (existingUser) {
            return res.status(409).json({ error: 'Email or username already registered' });
        }

        const user = new User({ email, password, full_name, username });
        await user.save();

        const { accessToken, refreshToken } = generateTokens(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        // Optional: Send welcome email
        await sendWelcomeEmail(email, full_name);

        res.status(201).json({
            message: 'Registration successful',
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                full_name: user.full_name,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        logger.error('Registration Error:', { error: error.message, stack: error.stack });
        res.status(500).json({ error: 'Registration failed. Please try again later.' });
    }
};

export const login = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ error: 'Request body is missing' });
        }

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({ error: 'Incorrect email or password' });
        }

        // Check DB connection status before attempt
        if (mongoose.connection.readyState !== 1) {
            logger.warn('MindWell: Login attempted while DB not connected.');
            return res.status(503).json({ error: 'Database connection is being established. Please try again in a few seconds.' });
        }

        // Check for JWT secrets early
        if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
            console.error('CRITICAL: JWT secrets are missing in environment variables.');
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Incorrect email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect email or password' });
        }

        // generateTokens uses JWT_SECRET/JWT_REFRESH_SECRET from top-level const
        const { accessToken, refreshToken } = generateTokens(user._id);

        // Save refreshToken to user session
        user.refreshToken = refreshToken;
        await user.save();

        console.log('MindWell: Login successful for user:', email);

        res.json({
            message: 'Login successful',
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                full_name: user.full_name,
                username: user.username || '', // Safe fallback for old users
                role: user.role
            }
        });
    } catch (error) {
        // Detailed logging as requested for 500 error debugging
        console.error("MindWell: Login 500 Internal Error:", error.message, error.stack);
        logger.error('MindWell: Login controller catch:', {
            message: error.message,
            stack: error.stack,
            email: req.body?.email
        });
        res.status(500).json({ error: 'Login failed. Please try again later.' });
    }
};

export const logout = async (req, res) => {
    try {
        const userId = req.user._id;
        await User.findByIdAndUpdate(userId, { refreshToken: '' });
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
};

export const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findOne({ _id: decoded.id, refreshToken });

        if (!user) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        const tokens = generateTokens(user._id);
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.json({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (error) {
        res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        // For security, don't reveal if email exists or not
        if (!user) {
            return res.json({ message: 'If this email exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const emailSent = await sendResetPasswordEmail(email, resetToken);
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
        }

        res.json({ message: 'If this email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ error: 'Processing failed. Please try again later.' });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successful. Please login with your new password.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ error: 'Reset failed. Please try again later.' });
    }
};

export const getMe = async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                email: req.user.email,
                full_name: req.user.full_name,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password.' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ error: 'Failed to update password. Please try again later.' });
    }
};
