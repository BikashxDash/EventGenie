import express from "express";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { buildIntakeSystemPrompt, buildIntakeUserPrompt } from "../prompts/intake.js";

const router = express.Router();

// ─── Gemini response schema ────────────────────────────────────────────────
const PLAN_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    eventSummary: {
      type: SchemaType.OBJECT,
      description: "High-level summary of the event",
      properties: {
        title: { type: SchemaType.STRING },
        tagline: { type: SchemaType.STRING },
        highlights: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      required: ["title", "tagline", "highlights"],
    },
    budgetAllocation: {
      type: SchemaType.OBJECT,
      description: "Budget split across categories. Percentages must sum to 100, amounts to total budget.",
      properties: {
        categories: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              percentage: { type: SchemaType.NUMBER },
              amountINR: { type: SchemaType.NUMBER },
              notes: { type: SchemaType.STRING },
            },
            required: ["name", "percentage", "amountINR", "notes"],
          },
        },
      },
      required: ["categories"],
    },
    timeline: {
      type: SchemaType.OBJECT,
      properties: {
        tasks: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              daysBeforeEvent: { type: SchemaType.NUMBER },
              label: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              category: { type: SchemaType.STRING },
              urgency: { type: SchemaType.STRING },
            },
            required: ["daysBeforeEvent", "label", "description", "category", "urgency"],
          },
        },
      },
      required: ["tasks"],
    },
    vendorChecklist: {
      type: SchemaType.OBJECT,
      properties: {
        categories: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              categoryName: { type: SchemaType.STRING },
              questionsToAsk: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
              documentsToCollect: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ["categoryName", "questionsToAsk", "documentsToCollect"],
          },
        },
      },
      required: ["categories"],
    },
    personalizedIdeas: {
      type: SchemaType.OBJECT,
      properties: {
        themes: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
            },
            required: ["title", "description"],
          },
        },
        decorIdeas: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        menuIdeas: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        activityIdeas: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
      },
      required: ["themes", "decorIdeas", "menuIdeas", "activityIdeas"],
    },
  },
  required: [
    "eventSummary",
    "budgetAllocation",
    "timeline",
    "vendorChecklist",
    "personalizedIdeas",
  ],
};

// ─── POST /api/plan ────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const intake = req.body;

    // Basic server-side validation
    if (
      !intake.eventType ||
      !intake.eventDate ||
      !intake.city ||
      !intake.guestCount ||
      !intake.totalBudget ||
      !intake.vibe
    ) {
      return res.status(400).json({ error: "Missing required intake fields." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const candidateModels = ["gemini-flash-latest", "gemini-3.8-flash"];
    const userPrompt = buildIntakeUserPrompt(intake);

    let plan = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: buildIntakeSystemPrompt(),
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: PLAN_SCHEMA,
              temperature: 0.7,
            },
          });

          const result = await model.generateContent(userPrompt);
          const rawText = result.response.text();
          plan = JSON.parse(rawText);
          break;
        } catch (err) {
          lastError = err;
          console.warn(`Attempt ${attempt} with ${modelName} failed:`, err.message);
          // Wait 1.5s before retry
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      if (plan) break;
    }

    if (!plan) {
      throw lastError || new Error("Failed to generate plan from AI models.");
    }

    return res.json({ plan });
  } catch (err) {
    console.error("Plan generation error:", err.message);
    const isQuota = err.message?.includes("quota") || err.message?.includes("429");
    return res.status(isQuota ? 429 : 500).json({
      error: isQuota
        ? "API quota exceeded. Please try again in a moment."
        : `Failed to generate plan: ${err.message}`,
    });
  }
});

export default router;
