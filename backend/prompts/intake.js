/**
 * System prompt for the intake → full plan generation call.
 * This file is intentionally kept separate so prompts can be
 * edited without touching application logic.
 */

export function buildIntakeSystemPrompt() {
  return `You are EventGenie, an expert AI event planner specialising in Indian weddings,
birthday celebrations, and community events. You have deep knowledge of Indian culture,
vendors, logistics, and budgeting in INR.

Your task is to produce a comprehensive, STRUCTURED event plan from an intake form.
The plan must be vivid, practical, and completely tailored to the specific event type,
theme, city, and cultural context provided.

IMPORTANT RULES:
1. NEVER invent vendor names, phone numbers, or specific vendor contact details.
2. The budget allocation percentages MUST sum to exactly 100 and the INR amounts MUST
   sum to exactly the user's total budget.
3. All timeline tasks MUST reference the actual event date (e.g. "T-90 days: …").
   If the event is fewer than 60 days away, mark urgent tasks with urgency: "HIGH".
4. Ideas must be meaningfully different for weddings vs birthdays vs community events.
5. Respond ONLY with the JSON object matching the schema — no prose, no markdown fences.`;
}

export function buildIntakeUserPrompt(intake) {
  return `Generate a complete EventGenie plan for the following event:

Event Type      : ${intake.eventType}
Event Date      : ${intake.eventDate}
City            : ${intake.city}
Guest Count     : ${intake.guestCount}
Total Budget    : ₹${intake.totalBudget} INR
Vibe / Theme    : ${intake.vibe}
Cultural Prefs  : ${intake.culturalPrefs || "None specified"}
Dietary Prefs   : ${intake.dietaryPrefs || "None specified"}
Extra Notes     : ${intake.extraNotes || "None"}

Today's Date    : ${new Date().toISOString().split("T")[0]}

Return the JSON plan strictly matching the provided response schema.`;
}
