import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

export const generateQuestion = async (sessionContext) => {
  const { data } = await axios.post(`${AI_SERVICE_URL}/api/generate/question`, sessionContext);
  return data;
};

export const scoreAnswer = async (question, answer) => {
  const { data } = await axios.post(`${AI_SERVICE_URL}/api/score/answer`, { question, answer });
  return data;
};