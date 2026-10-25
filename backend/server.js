import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import planRouter from "./routes/plan.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "\n❌  GEMINI_API_KEY is not set in .env\n" +
    "    Create backend/.env and add: GEMINI_API_KEY=your_key_here\n"
  );
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:4173"] }));
app.use(express.json({ limit: "2mb" }));

// ─── Routes ───────────────────────────────────────────────────────────────
app.use("/api/plan", planRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  EventGenie backend running at http://localhost:${PORT}\n`);
});
