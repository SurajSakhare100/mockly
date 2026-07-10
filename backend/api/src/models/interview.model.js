import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    questions: [{ question: String, answer: String, score: Number, feedback: String }],
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);