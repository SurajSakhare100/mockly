import express from "express";
import { register, login, googleLogin } from "../controllers/auth.controller.js";

const router = express.Router();

// @route   POST /api/auth/register
router.post("/register", register);

// @route   POST /api/auth/login
router.post("/login", login);

// @route   POST /api/auth/google
router.post("/google", googleLogin);

export default router;
