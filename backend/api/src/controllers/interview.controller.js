import Interview from "../models/interview.model.js";
import { generateQuestion, scoreAnswer } from "../services/aiClient.js";

export const startInterview = async (req, res) => {
  const { role } = req.body;
  const interview = await Interview.create({ userId: req.user.id, role, questions: [] });

  const firstQuestion = await generateQuestion({ role, history: [] });
  res.json({ interviewId: interview._id, question: firstQuestion.question });
};

export const submitAnswer = async (req, res) => {
  const { interviewId, question, answer } = req.body;

  const result = await scoreAnswer(question, answer);
  const interview = await Interview.findById(interviewId);
  interview.questions.push({ question, answer, score: result.score, feedback: result.feedback });
  await interview.save();

  const nextQuestion = await generateQuestion({
    role: interview.role,
    history: interview.questions,
  });

  res.json({ feedback: result.feedback, score: result.score, nextQuestion: nextQuestion.question });
};