import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

export async function generatePlan(intakeData) {
  const response = await api.post("/plan", intakeData);
  return response.data;
}

export async function regenerateIdeasSection(section, intake, currentPlan) {
  const response = await api.post("/plan/regenerate-section", {
    section,
    intake,
    currentPlan,
  });
  return response.data;
}

export async function sendChatMessage(message, currentPlan, intake, chatHistory) {
  const response = await api.post("/plan/chat", {
    message,
    currentPlan,
    intake,
    chatHistory,
  });
  return response.data;
}

export default api;
