import express from "express";
import { startInterview, submitAnswer } from "../controllers/interview.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/start", protect, startInterview);
router.post("/answer", protect, submitAnswer);

export default router;