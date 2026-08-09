import express from "express";

import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
  getAllUsers,
  deleteUser,
  deleteAllUsers,
  createAdmin,
  createFirstAdmin,
} from "../Controller/authController.js";

import { auth, admin } from "../Middleware/authMiddleware.js";

const router = express.Router();

// ================= AUTH =================

router.post("/register", register);

router.post("/login", login);

router.post("/logout", auth, logout);

router.post("/refresh-token", refreshToken);

// ================= PASSWORD =================

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.put("/change-password", auth, changePassword);

// ================= PROFILE =================

router.get("/me", auth, getMe);

// ================= USERS =================

router.get("/users", auth, admin, getAllUsers);

router.delete("/user/:id", auth, admin, deleteUser);

router.delete("/users", auth, admin, deleteAllUsers);
// ================= ADMIN =================

// ================= ADMIN =================

router.post("/create-admin",auth,admin,createAdmin);
// ================= FIRST ADMIN SETUP =================

router.post("/create-first-admin",createFirstAdmin);

export default router;