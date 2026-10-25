/**
 * System and user prompt builders for intake -> full plan generation call.
 * Handles Phase 3 countdown-based timeline generation with dynamic compression,
 * event-type specific task lists, and risk warnings.
 */

export function buildIntakeSystemPrompt() {
  return `You are EventGenie, an expert AI event planner specialising in Indian weddings,
birthday celebrations, and community/fundraiser events. You have deep knowledge of Indian culture,
vendors, logistics, budgeting in INR, and time management.

Your task is to produce a comprehensive, STRUCTURED event plan from an intake form.
The plan must be vivid, practical, and completely tailored to the specific event type,
theme, city, and cultural context provided.

CRITICAL RULES FOR TIMELINE GENERATION:
1. Ideal planning windows:
   - Wedding: 180 days (6 months)
   - Birthday: 45 days
   - Community Event / Fundraiser: 90 days

2. Timeline Compression Logic:
   - If actualDaysRemaining < idealLeadDays:
     * Set timeline.isCompressed = true.
     * In timeline.compressionNotice: Explain clearly and specifically what was compressed (e.g., custom invites replaced by instant WhatsApp/digital invites, express off-the-rack attire instead of custom tailoring, immediate venue phone lock-in).
     * ALL tasks MUST have daysBeforeEvent <= actualDaysRemaining! E.g. if event is 10 days away, milestones must be at T-10, T-8, T-6, T-4, T-2, T-1, T-0 days. DO NOT suggest T-90 when only 10 days remain!
     * For tasks with high risk due to compression (venue booking, invitations, permits, attire, catering lock-in), set isRisky = true, urgency = "CRITICAL", and provide a specific, actionable riskWarning.
   - If actualDaysRemaining >= idealLeadDays:
     * Set timeline.isCompressed = false.
     * Provide a comfortable milestone countdown plan across the months.

3. Distinct Task Lists by Event Type:
   - Wedding: Must include venue contract, bridal/groom attire & fittings, wedding invitations/RSVP, catering tasting & Maharaj lock-in, mandap & floral production, photographer & drone, sangeet/mehendi choreography, rituals logistics, and day-of coordination.
   - Birthday: Must include venue/lounge booking, custom theme cake & dessert counter, digital animated invites, entertainment (DJ/magician/games emcee), balloon backdrop & decor, party favors, food & mocktail bar, playlist curation.
   - Community / Fundraiser: Must include municipal/police permissions, sound/PPL licenses, sponsor deck & sponsor outreach, chief guest/speaker invitations, ticket platform/donation ledger setup, volunteer recruitment & briefings, stage/AV setup & emergency plan, press release, post-event donor receipts.

4. Vendor Checklist Rules:
   - For each budget category (Venue, Catering, Decor, Photography, Entertainment, Misc/Logistics), generate:
     * questionsToAsk: 3-5 sharp, probing screening questions tailored to the event type (wedding vs birthday vs fundraiser). E.g. wedding catering asks about food tasting, Maharaj credentials, guest buffer; birthday catering asks about kid-friendly portions, allergy handling, custom cake cutting fees; fundraiser asks about bulk pricing, volunteer meals, sponsor branding.
     * documentsToCollect: Essential contracts, cancellation terms, insurance, FSSAI certificates, licenses.
     * redFlags: 3 specific warning signs to watch out for during negotiations (e.g. refusing written quote, no tasting before deposit, vague overtime charges).
   - CRITICAL RULE: NEVER invent vendor names, phone numbers, or prices.

5. Budget integrity:
   - Allocation percentages MUST sum to exactly 100%.
   - Amount in INR MUST sum to exactly totalBudget.

6. Respond strictly with the JSON object matching the response schema.`;
}

export function buildIntakeUserPrompt(intake) {
  const today = new Date();
  const eventDateObj = new Date(intake.eventDate);
  const diffTime = eventDateObj.getTime() - today.getTime();
  const actualDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const idealDaysMap = {
    wedding: 180,
    birthday: 45,
    community: 90,
  };
  const idealLeadDays = idealDaysMap[intake.eventType] || 90;
  const isCompressed = actualDaysRemaining < idealLeadDays;

  return `Generate a complete EventGenie plan for the following event:

Event Type           : ${intake.eventType}
Event Date           : ${intake.eventDate}
Today's Date         : ${today.toISOString().split("T")[0]}
Days Until Event     : ${actualDaysRemaining} days
Ideal Planning Window: ${idealLeadDays} days
Is Compressed        : ${isCompressed ? "YES - RUSH COMPRESSION REQUIRED" : "NO - STANDARD TIMELINE"}
City                 : ${intake.city}
Guest Count          : ${intake.guestCount}
Total Budget         : ₹${intake.totalBudget} INR
Vibe / Theme         : ${intake.vibe}
Cultural Prefs       : ${intake.culturalPrefs || "None specified"}
Dietary Prefs        : ${intake.dietaryPrefs || "None specified"}
Extra Notes          : ${intake.extraNotes || "None"}

TIMELINE INSTRUCTIONS:
- idealLeadDays: ${idealLeadDays}
- actualDaysRemaining: ${actualDaysRemaining}
- isCompressed: ${isCompressed}
- Provide 7 to 10 sequential tasks ordered from earliest (highest daysBeforeEvent) to day-of (0 daysBeforeEvent).
- ${isCompressed ? `COMPRESSION ACTIVE: Every task's daysBeforeEvent must be <= ${actualDaysRemaining}. Clearly explain in compressionNotice what compromises and rush steps are taken. Flag high-risk tasks with isRisky=true and a warning.` : `Comfortable timeline: Space tasks across the ${actualDaysRemaining} days.`}

Return the JSON plan strictly matching the schema.`;
}
