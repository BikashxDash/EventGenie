import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

export async function generatePlan(intakeData) {
  const response = await api.post("/plan", intakeData);
  return response.data;
}

export default api;
