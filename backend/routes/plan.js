import express from "express";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { buildIntakeSystemPrompt, buildIntakeUserPrompt } from "../prompts/intake.js";

const router = express.Router();

// Candidate models in fallback order
const CANDIDATE_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
];

// Helper to execute Gemini generation with multi-model fallback
async function callGeminiWithFallback({ systemInstruction, userPrompt, responseSchema, temperature = 0.7 }) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
            temperature,
          },
        });

        const result = await model.generateContent(userPrompt);
        const rawText = result.response.text();
        return JSON.parse(rawText);
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini] Attempt ${attempt} with ${modelName} failed:`, err.message);
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }
  throw lastError || new Error("All Gemini candidate models failed.");
}

// ─── Gemini response schema for Intake Plan ──────────────────────────────────
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
              tag: { type: SchemaType.STRING },
            },
            required: ["title", "description"],
          },
        },
        decorIdeas: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              tag: { type: SchemaType.STRING },
            },
            required: ["title", "description"],
          },
        },
        menuIdeas: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              tag: { type: SchemaType.STRING },
            },
            required: ["title", "description"],
          },
        },
        activityIdeas: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              tag: { type: SchemaType.STRING },
            },
            required: ["title", "description"],
          },
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

// ─── Normalization & Rebalancing Helpers ─────────────────────────────────────
function normalizeIdeas(ideasObj) {
  if (!ideasObj) return { themes: [], decorIdeas: [], menuIdeas: [], activityIdeas: [] };
  const sections = ["themes", "decorIdeas", "menuIdeas", "activityIdeas"];
  const result = {};

  sections.forEach((sec) => {
    const list = Array.isArray(ideasObj[sec]) ? ideasObj[sec] : [];
    result[sec] = list.map((item, idx) => {
      if (typeof item === "string") {
        return {
          id: `${sec}-${idx + 1}`,
          title: item.split(" - ")[0] || item.slice(0, 40),
          description: item.includes(" - ") ? item.split(" - ").slice(1).join(" - ") : item,
          tag: sec === "menuIdeas" ? "Curated" : "Featured",
        };
      }
      return {
        id: item.id || `${sec}-${idx + 1}`,
        title: item.title || `Idea ${idx + 1}`,
        description: item.description || "",
        tag: item.tag || (sec === "menuIdeas" ? "Curated" : "Featured"),
      };
    });
  });

  return result;
}

function sanitizeAndRebalancePlan(plan, intake, originalPlan = null, originalIntake = null) {
  // 1. Budget integrity: sum of amounts must match totalBudget exactly
  const totalBudget = Number(intake.totalBudget) || 0;
  if (plan.budgetAllocation && Array.isArray(plan.budgetAllocation.categories) && totalBudget > 0) {
    const categories = plan.budgetAllocation.categories;
    const currentSum = categories.reduce((sum, c) => sum + (Number(c.amountINR) || 0), 0);

    if (currentSum > 0 && currentSum !== totalBudget) {
      const scale = totalBudget / currentSum;
      let runningSum = 0;
      categories.forEach((cat, idx) => {
        if (idx === categories.length - 1) {
          cat.amountINR = Math.max(0, totalBudget - runningSum);
        } else {
          cat.amountINR = Math.round(Number(cat.amountINR) * scale);
          runningSum += cat.amountINR;
        }
        cat.percentage = Number(((cat.amountINR / totalBudget) * 100).toFixed(1));
      });
    }
  }

  // 2. Timeline recalculation based on intake.eventDate
  if (intake.eventDate && plan.timeline) {
    const today = new Date();
    const eventDateObj = new Date(intake.eventDate);
    const actualDaysRemaining = Math.max(
      0,
      Math.ceil((eventDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );
    const idealDaysMap = { wedding: 180, birthday: 45, community: 90 };
    const idealLeadDays = plan.timeline.idealLeadDays || idealDaysMap[intake.eventType] || 90;
    const isCompressed = actualDaysRemaining < idealLeadDays;

    plan.timeline.actualDaysRemaining = actualDaysRemaining;
    plan.timeline.idealLeadDays = idealLeadDays;
    plan.timeline.isCompressed = isCompressed;

    if (isCompressed && (!plan.timeline.compressionNotice || plan.timeline.compressionNotice === "None")) {
      plan.timeline.compressionNotice = `Event moved earlier! Planning window is now compressed to ${actualDaysRemaining} days. Rush bookings and priority coordination required.`;
    }

    if (Array.isArray(plan.timeline.tasks)) {
      plan.timeline.tasks = plan.timeline.tasks.map((task, idx) => {
        const clampedDays = Math.min(
          actualDaysRemaining,
          Math.max(0, Number(task.daysBeforeEvent) || 0)
        );
        const targetDateObj = new Date(eventDateObj.getTime() - clampedDays * 86400000);
        const isRushRisk = isCompressed && clampedDays <= 14;

        return {
          ...task,
          id: task.id || `task-${idx + 1}`,
          daysBeforeEvent: clampedDays,
          targetDate: targetDateObj.toISOString().split("T")[0],
          urgency: task.urgency || (isRushRisk ? "CRITICAL" : "MEDIUM"),
          isRisky: Boolean(task.isRisky || isRushRisk),
          riskWarning:
            task.riskWarning ||
            (isRushRisk ? "Urgent lead time: confirm vendor immediately." : ""),
        };
      });
      plan.timeline.tasks.sort((a, b) => b.daysBeforeEvent - a.daysBeforeEvent);
    }
  }

  // 3. Ideas normalization
  if (plan.personalizedIdeas) {
    plan.personalizedIdeas = normalizeIdeas(plan.personalizedIdeas);
  }

  // 4. Vendors normalization
  if (plan.vendorChecklist && Array.isArray(plan.vendorChecklist.categories)) {
    plan.vendorChecklist.categories = plan.vendorChecklist.categories.map((cat, idx) => ({
      ...cat,
      id: cat.id || `vendor-cat-${idx + 1}`,
      questionsToAsk: cat.questionsToAsk || [],
      documentsToCollect: cat.documentsToCollect || [],
      redFlags: cat.redFlags || [],
    }));
  }

  // 5. Build accurate diff items
  const diffItems = [];
  if (originalIntake && originalPlan) {
    if (Number(originalIntake.totalBudget) !== Number(intake.totalBudget)) {
      diffItems.push({
        field: "Total Budget",
        before: `₹${Number(originalIntake.totalBudget).toLocaleString("en-IN")}`,
        after: `₹${Number(intake.totalBudget).toLocaleString("en-IN")}`,
      });
    }
    if (originalIntake.eventDate !== intake.eventDate) {
      diffItems.push({
        field: "Event Date",
        before: `${originalIntake.eventDate} (${originalPlan.timeline?.actualDaysRemaining ?? "?"} days left)`,
        after: `${intake.eventDate} (${plan.timeline?.actualDaysRemaining ?? "?"} days left${plan.timeline?.isCompressed ? " - Rush Compressed" : ""})`,
      });
    }
    if (originalIntake.dietaryPrefs !== intake.dietaryPrefs) {
      diffItems.push({
        field: "Dietary Preference",
        before: originalIntake.dietaryPrefs || "Standard",
        after: intake.dietaryPrefs || "Standard",
      });
    }
    if (originalPlan.timeline?.isCompressed !== plan.timeline?.isCompressed) {
      diffItems.push({
        field: "Timeline Status",
        before: originalPlan.timeline?.isCompressed ? "Compressed" : "Standard",
        after: plan.timeline?.isCompressed ? "Compressed (Rush Plan)" : "Standard Timeline",
      });
    }
  }

  return { plan, intake, diffItems };
}

// ─── POST /api/plan ────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const intake = req.body;

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

    const userPrompt = buildIntakeUserPrompt(intake);
    const rawPlan = await callGeminiWithFallback({
      systemInstruction: buildIntakeSystemPrompt(),
      userPrompt,
      responseSchema: PLAN_SCHEMA,
      temperature: 0.7,
    });

    const { plan } = sanitizeAndRebalancePlan(rawPlan, intake);
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

// ─── POST /api/plan/regenerate-section ──────────────────────────────────────
const REGEN_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    ideas: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          tag: { type: SchemaType.STRING },
        },
        required: ["title", "description"],
      },
    },
  },
  required: ["ideas"],
};

router.post("/regenerate-section", async (req, res) => {
  try {
    const { section, intake } = req.body;
    if (!section || !intake) {
      return res.status(400).json({ error: "Section and intake data are required." });
    }

    const sectionLabels = {
      themes: "Thematic Concepts & Styles",
      decorIdeas: "Decor, Floral, Stage & Lighting Setups",
      menuIdeas: "Catering Menu, Live Stations & Signature Dishes",
      activityIdeas: "Interactive Activities, Entertainment & Guest Experiences",
    };

    const sectionLabel = sectionLabels[section] || section;
    const dietaryRule =
      section === "menuIdeas"
        ? `STRICT DIETARY REQUIREMENT: The dietary preference is "${intake.dietaryPrefs || "None"}".
           Every single one of the 5 menu ideas MUST 100% strictly adhere to this dietary restriction!
           If Pure Vegetarian or Jain, DO NOT include meat, poultry, fish, seafood or egg.
           Label the tag accordingly (e.g., "Pure Vegetarian", "Jain-Friendly", "Vegan", "Signature Course").`
        : "";

    const systemInstruction = `You are EventGenie, an expert Indian event and wedding co-planner.
Generate exactly 5 fresh, distinct, creative, and memorable ideas for the "${sectionLabel}" section.
Make them tailored to:
- Event: ${intake.eventType} in ${intake.city}
- Vibe: ${intake.vibe}
- Cultural heritage: ${intake.culturalPrefs || "Standard"}
- Budget level: ₹${Number(intake.totalBudget).toLocaleString("en-IN")} INR
${dietaryRule}

Provide a punchy title, vivid 1-2 sentence description, and a short 1-2 word tag for each idea.
Return JSON with the 'ideas' array containing exactly 5 items.`;

    const userPrompt = `Regenerate 5 brand-new, innovative ideas for "${sectionLabel}". Make them inspiring and distinct from generic suggestions.`;

    const result = await callGeminiWithFallback({
      systemInstruction,
      userPrompt,
      responseSchema: REGEN_SCHEMA,
      temperature: 0.85,
    });

    const ideas = (result.ideas || []).slice(0, 5).map((item, idx) => ({
      id: `${section}-${Date.now()}-${idx + 1}`,
      title: item.title,
      description: item.description,
      tag: item.tag || (section === "menuIdeas" ? "Curated" : "Featured"),
    }));

    return res.json({ section, ideas });
  } catch (err) {
    console.error("Regenerate section error:", err.message);
    const isQuota = err.message?.includes("quota") || err.message?.includes("429");
    return res.status(isQuota ? 429 : 500).json({
      error: isQuota
        ? "API quota exceeded. Please try again in a moment."
        : `Failed to regenerate ideas: ${err.message}`,
    });
  }
});

// ─── POST /api/plan/chat (Conversational Co-Planner) ────────────────────────
const CHAT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    actionType: {
      type: SchemaType.STRING,
      description: "One of: 'MODIFY_BUDGET', 'MODIFY_TIMELINE', 'MODIFY_PREFERENCES', 'GENERAL_UPDATE', 'NO_CHANGE'",
    },
    changeSummary: {
      type: SchemaType.STRING,
      description: "Clear, concise summary of changes made (e.g., 'Reduced total budget by 20% to ₹20,00,000 and balanced category amounts proportionally.')",
    },
    diffItems: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          field: { type: SchemaType.STRING },
          before: { type: SchemaType.STRING },
          after: { type: SchemaType.STRING },
        },
        required: ["field", "before", "after"],
      },
    },
    chatReply: {
      type: SchemaType.STRING,
      description: "Conversational, polite response to the user explaining what changed and providing expert planning guidance.",
    },
    updatedIntake: {
      type: SchemaType.OBJECT,
      properties: {
        eventType: { type: SchemaType.STRING },
        eventDate: { type: SchemaType.STRING },
        city: { type: SchemaType.STRING },
        guestCount: { type: SchemaType.NUMBER },
        totalBudget: { type: SchemaType.NUMBER },
        vibe: { type: SchemaType.STRING },
        culturalPrefs: { type: SchemaType.STRING },
        dietaryPrefs: { type: SchemaType.STRING },
        extraNotes: { type: SchemaType.STRING },
      },
      required: ["eventType", "eventDate", "city", "guestCount", "totalBudget", "vibe"],
    },
    updatedPlan: PLAN_SCHEMA,
  },
  required: ["actionType", "changeSummary", "diffItems", "chatReply", "updatedIntake", "updatedPlan"],
};

router.post("/chat", async (req, res) => {
  try {
    const { message, currentPlan, intake, chatHistory = [] } = req.body;

    if (!message || !currentPlan || !intake) {
      return res.status(400).json({ error: "Missing required message, plan, or intake state." });
    }

    const systemInstruction = `You are EventGenie Co-Planner, a world-class AI event planning assistant.
You possess complete access to the current event plan (budget split, countdown timeline, vendor screening checklist, and personalized ideas).
When the user asks you to modify something, you MUST NOT ONLY reply in text — you MUST directly update the plan data structures!

COMMON MODIFICATION INSTRUCTIONS:
1. "cut the budget by X%" / "reduce budget to Y":
   - Compute newTotalBudget = currentTotalBudget * (1 - X/100).
   - Set updatedIntake.totalBudget = Math.round(newTotalBudget).
   - In updatedPlan.budgetAllocation.categories, proportionally scale down each category's amountINR so the sum of amountINR equals newTotalBudget exactly! Percentages must sum to 100%.
   - Set actionType = 'MODIFY_BUDGET'.

2. "make it vegetarian" / "switch to pure vegetarian" / dietary change:
   - Set updatedIntake.dietaryPrefs = 'Pure Vegetarian'.
   - In updatedPlan.personalizedIdeas.menuIdeas, replace any non-vegetarian ideas with 5 exquisite gourmet vegetarian dish/station concepts (e.g. Paneer Pasanda Live Tawa, Dal Bukhara & Truffle Kulcha, Avadhi Subz Dum Biryani, Gourmet Chaat Station, Artisanal Kulfi Counter).
   - In updatedPlan.budgetAllocation.categories, update catering notes to reflect Pure Vegetarian catering.
   - In updatedPlan.vendorChecklist, ensure catering screening questions include pure vegetarian Maharaj credentials and segregated kitchen guarantees.
   - Set actionType = 'MODIFY_PREFERENCES'.

3. "move the event 2 weeks earlier" / date shift:
   - Calculate the new eventDate by subtracting 14 days from current intake.eventDate (in YYYY-MM-DD format).
   - Set updatedIntake.eventDate = newDate.
   - Recalculate timeline countdowns and days remaining. If now compressed (actualDaysRemaining < idealLeadDays), set isCompressed = true, add a compression notice, clamp task days, and flag risky tasks with warnings.
   - Set actionType = 'MODIFY_TIMELINE'.

4. General questions or advice:
   - Provide helpful advice in chatReply, keep updatedPlan and updatedIntake consistent. Set actionType = 'NO_CHANGE' or 'GENERAL_UPDATE'.

CRITICAL RULES:
- Never break budget balance: sum of category amountINR must equal updatedIntake.totalBudget.
- Always provide clear before/after entries in diffItems.
- Return response strictly matching the CHAT_SCHEMA JSON format.`;

    const userPrompt = `CURRENT INTAKE:
${JSON.stringify(intake, null, 2)}

CURRENT PLAN:
${JSON.stringify(currentPlan, null, 2)}

RECENT CHAT HISTORY:
${JSON.stringify(chatHistory.slice(-4), null, 2)}

USER REQUEST:
"${message}"

Execute this request. Update all affected fields in updatedPlan and updatedIntake, and summarize changes clearly.`;

    const rawResponse = await callGeminiWithFallback({
      systemInstruction,
      userPrompt,
      responseSchema: CHAT_SCHEMA,
      temperature: 0.6,
    });

    // Run deterministic validation & rebalancing on server
    const { plan: validatedPlan, intake: validatedIntake, diffItems: serverDiffs } =
      sanitizeAndRebalancePlan(
        rawResponse.updatedPlan,
        rawResponse.updatedIntake,
        currentPlan,
        intake
      );

    // Merge server diffs if Gemini missed any
    const finalDiffItems = serverDiffs.length > 0 ? serverDiffs : (rawResponse.diffItems || []);

    return res.json({
      actionType: rawResponse.actionType || "GENERAL_UPDATE",
      changeSummary: rawResponse.changeSummary || "Plan updated successfully.",
      diffItems: finalDiffItems,
      chatReply: rawResponse.chatReply || "I've updated your event plan accordingly.",
      updatedPlan: validatedPlan,
      updatedIntake: validatedIntake,
    });
  } catch (err) {
    console.error("Chat co-planner error:", err.message);
    const isQuota = err.message?.includes("quota") || err.message?.includes("429");
    return res.status(isQuota ? 429 : 500).json({
      error: isQuota
        ? "API quota exceeded. Please try again in a moment."
        : `Failed to process plan update: ${err.message}`,
    });
  }
});

export default router;
