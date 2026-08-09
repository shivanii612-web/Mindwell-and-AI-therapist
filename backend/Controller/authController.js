import User from "../Models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "../Utils/logger.js";
import {
  sendWelcomeEmail,
  sendResetPasswordEmail,
} from "../services/emailService.js";

dotenv.config();

const JWT_SECRET =
  process.env.JWT_SECRET || "mindwell-secure-secret-2024";

const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "mindwell-refresh-secret-2024";

// ================= GENERATE TOKENS =================

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    accessToken,
    refreshToken,
  };
};

// ================= REGISTER =================

export const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (
      !full_name ||
      !email ||
      !password ||
      typeof full_name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Full name, email and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email already exists.",
      });
    }

    const user = new User({
      full_name,
      email: normalizedEmail,
      password,
    });

    await user.save();

    const { accessToken, refreshToken } =
      generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    try {
      await sendWelcomeEmail(
        normalizedEmail,
        full_name
      );
    } catch (err) {
      logger.warn("Welcome Email Error", {
        message: err.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful.",

      token: accessToken,
      refreshToken,

      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Register Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Registration failed.",
    });
  }
};

// ================= LOGIN =================

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      !email ||
      !password ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase();

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database not connected.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: "Your account has been blocked. Please contact support.",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        error: "Your account has been suspended. Please contact support.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const { accessToken, refreshToken } =
      generateTokens(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    logger.info("Login Success", {
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",

      token: accessToken,
      refreshToken,

      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Login Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Login failed.",
    });
  }
};
// ================= LOGOUT =================

export const logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      refreshToken: "",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    logger.error("Logout Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Logout failed.",
    });
  }
};

// ================= REFRESH TOKEN =================

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: "Refresh token is required.",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      JWT_REFRESH_SECRET
    );

    const user = await User.findOne({
      _id: decoded.id,
      refreshToken,
    });

    if (!user) {
      return res.status(403).json({
        error: "Invalid refresh token.",
      });
    }

    const tokens = generateTokens(user._id);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return res.status(200).json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

  } catch (error) {

    logger.error("Refresh Token Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(403).json({
      error: "Invalid or expired refresh token.",
    });
  }
};

// ================= FORGOT PASSWORD =================

export const forgotPassword = async (req, res) => {
  try {

    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        error: "Email is required.",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Security: don't reveal whether the email exists
    if (!user) {
      return res.status(200).json({
        message:
          "If this email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires =
      Date.now() + 60 * 60 * 1000; // 1 hour

    await user.save();

    try {
      await sendResetPasswordEmail(
        normalizedEmail,
        resetToken
      );
    } catch (err) {
      logger.warn("Reset Email Error", {
        message: err.message,
      });

      return res.status(500).json({
        error: "Failed to send reset email.",
      });
    }

    return res.status(200).json({
      message:
        "If this email exists, a password reset link has been sent.",
    });

  } catch (error) {

    logger.error("Forgot Password Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Failed to process forgot password request.",
    });
  }
};
// ================= RESET PASSWORD =================

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: "Token and new password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters.",
      });
    }

    // Validate token: must be a 64-char hex string produced by crypto.randomBytes(32)
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: "Invalid or expired token.",
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    logger.error("Reset Password Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Password reset failed.",
    });
  }
};

// ================= GET LOGGED IN USER =================

export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        full_name: req.user.full_name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    logger.error("Get Profile Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Failed to fetch profile.",
    });
  }
};

// ================= CHANGE PASSWORD =================

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current password and new password are required.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        error: "Current password is incorrect.",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    logger.error("Change Password Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Failed to change password.",
    });
  }
};

// ================= GET ALL USERS =================

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password -refreshToken");

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    logger.error("Get Users Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Failed to fetch users.",
    });
  }
};

// ================= DELETE USER =================

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    logger.error("Delete User Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Failed to delete user.",
    });
  }
};

// ================= DELETE ALL USERS =================

export const deleteAllUsers = async (req, res) => {
  try {
    const result = await User.deleteMany({});

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: "All users deleted successfully.",
    });
  } catch (error) {
    logger.error("Delete All Users Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Failed to delete all users.",
    });
  }
};
// ================= CREATE ADMIN =================

export const createAdmin = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (
      !full_name ||
      !email ||
      !password ||
      typeof full_name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Full name, email and password are required.",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email already exists.",
      });
    }

    const admin = new User({
      full_name,
      email: email.toLowerCase(),
      password,
      role: "admin",
    });

    await admin.save();

    return res.status(201).json({
      success: true,
      message: "Admin created successfully.",
      user: {
        id: admin._id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    logger.error("Create Admin Error", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      error: "Failed to create admin.",
    });
  }
};
// ================= CREATE FIRST ADMIN =================

export const createFirstAdmin = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    if (
      !full_name ||
      !email ||
      !password ||
      typeof full_name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Full name, email and password are required.",
      });
    }

    const existingAdmin = await User.findOne({
      role: "admin",
    });

    if (existingAdmin) {
      return res.status(400).json({
        error: "Admin already exists.",
      });
    }

    const admin = new User({
      full_name,
      email: email.toLowerCase(),
      password,
      role: "admin",
    });

    await admin.save();

    return res.status(201).json({
      success: true,
      message: "First admin created successfully.",
    });

  } catch (error) {
    return res.status(500).json({
      error: "Failed to create admin.",
    });
  }
};