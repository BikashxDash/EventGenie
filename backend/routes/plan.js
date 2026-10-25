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
        isCompressed: { type: SchemaType.BOOLEAN },
        compressionNotice: { type: SchemaType.STRING },
        idealLeadDays: { type: SchemaType.NUMBER },
        actualDaysRemaining: { type: SchemaType.NUMBER },
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
              isRisky: { type: SchemaType.BOOLEAN },
              riskWarning: { type: SchemaType.STRING },
            },
            required: [
              "daysBeforeEvent",
              "label",
              "description",
              "category",
              "urgency",
              "isRisky",
              "riskWarning",
            ],
          },
        },
      },
      required: [
        "isCompressed",
        "compressionNotice",
        "idealLeadDays",
        "actualDaysRemaining",
        "tasks",
      ],
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
              redFlags: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ["categoryName", "questionsToAsk", "documentsToCollect", "redFlags"],
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
    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-flash-latest"
    ];
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

    // Post-process timeline tasks to ensure unique IDs, calendar target dates, and clamped days
    const eventDateObj = new Date(intake.eventDate);
    const today = new Date();
    const actualDaysRemaining = Math.max(0, Math.ceil((eventDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const idealDaysMap = { wedding: 180, birthday: 45, community: 90 };
    const idealLeadDays = idealDaysMap[intake.eventType] || 90;

    if (plan.timeline) {
      plan.timeline.actualDaysRemaining = actualDaysRemaining;
      plan.timeline.idealLeadDays = idealLeadDays;
      plan.timeline.isCompressed = actualDaysRemaining < idealLeadDays;

      if (Array.isArray(plan.timeline.tasks)) {
        plan.timeline.tasks = plan.timeline.tasks.map((task, idx) => {
          const clampedDays = Math.min(actualDaysRemaining, Math.max(0, Number(task.daysBeforeEvent) || 0));
          const targetDateObj = new Date(eventDateObj.getTime() - clampedDays * 86400000);
          const targetDateStr = targetDateObj.toISOString().split("T")[0];

          return {
            ...task,
            id: `task-${idx + 1}`,
            daysBeforeEvent: clampedDays,
            targetDate: targetDateStr,
            urgency: task.urgency || (task.isRisky ? "CRITICAL" : "MEDIUM"),
            isRisky: Boolean(task.isRisky),
            riskWarning: task.riskWarning || "",
          };
        });
        // Sort descending by daysBeforeEvent (T-90 -> T-60 -> T-0)
        plan.timeline.tasks.sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent);
      }
    }

    if (plan.vendorChecklist && Array.isArray(plan.vendorChecklist.categories)) {
      plan.vendorChecklist.categories = plan.vendorChecklist.categories.map((cat, idx) => ({
        ...cat,
        id: `vendor-cat-${idx + 1}`,
        redFlags: cat.redFlags || [],
        questionsToAsk: cat.questionsToAsk || [],
        documentsToCollect: cat.documentsToCollect || [],
      }));
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
