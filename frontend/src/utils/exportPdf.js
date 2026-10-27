import { jsPDF } from "jspdf";

/**
 * Generates and downloads a clean, multi-page, publication-ready PDF event plan.
 * Handles page breaks, running headers/footers, budget breakdown, pie/bar visual,
 * countdown timeline, vendor checklist with statuses & quoted amounts, and ideas.
 */
export async function exportEventPlanToPdf({ plan, intake, vendorStatuses = {}, savedFavorites = {} }) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const bottomThreshold = pageHeight - 20;

  let y = margin;
  let pageNumber = 1;

  // Colors
  const PRIMARY = [124, 92, 252]; // #7c5cfc (EventGenie purple)
  const TEXT_DARK = [25, 23, 38];
  const TEXT_MUTED = [100, 100, 115];
  const BORDER_COLOR = [225, 225, 235];
  const ACCENT_BG = [248, 247, 255];
  const SUCCESS_COLOR = [16, 185, 129];
  const WARNING_COLOR = [245, 158, 11];

  function drawRunningHeader() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...PRIMARY);
    doc.text("EventGenie ✨ AI Event Blueprint", margin, 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    const titleText = plan?.eventSummary?.title || "Event Blueprint";
    const titleTruncated = titleText.length > 40 ? titleText.slice(0, 37) + "..." : titleText;
    doc.text(titleTruncated, pageWidth - margin, 10, { align: "right" });

    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  }

  function drawRunningFooter(pNum) {
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("Confidential & Prepared exclusively with EventGenie AI", margin, pageHeight - 8);
    doc.text(`Page ${pNum}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > bottomThreshold) {
      drawRunningFooter(pageNumber);
      doc.addPage();
      pageNumber++;
      y = 18;
      drawRunningHeader();
    }
  }

  // ─── First Page Header Banner ──────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("EventGenie ✨ Comprehensive Event Blueprint", margin + 6, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(230, 225, 255);
  doc.text(
    `Prepared on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} | Powered by Google Gemini`,
    margin + 6,
    y + 18
  );

  y += 32;

  // ─── Event Title & Tagline ─────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...TEXT_DARK);
  const titleLines = doc.splitTextToSize(plan?.eventSummary?.title || "My Event Plan", contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7;

  if (plan?.eventSummary?.tagline) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_MUTED);
    const taglineLines = doc.splitTextToSize(`"${plan.eventSummary.tagline}"`, contentWidth);
    doc.text(taglineLines, margin, y);
    y += taglineLines.length * 5 + 4;
  }

  // ─── Key Meta Grid ────────────────────────────────────────────────────────
  checkPageBreak(30);
  const metaItems = [
    { label: "Event Type", value: intake.eventType.toUpperCase() },
    { label: "Event Date", value: new Date(intake.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
    { label: "Destination", value: intake.city },
    { label: "Guest Count", value: `${Number(intake.guestCount).toLocaleString("en-IN")} Guests` },
    { label: "Total Budget", value: `₹${Number(intake.totalBudget).toLocaleString("en-IN")}` },
    { label: "Dietary", value: intake.dietaryPrefs || "Standard" },
  ];

  const colW = contentWidth / 3;
  metaItems.forEach((item, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const bx = margin + col * colW;
    const by = y + row * 14;

    doc.setFillColor(...ACCENT_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(bx, by, colW - 3, 12, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(item.label.toUpperCase(), bx + 3, by + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(item.value, bx + 3, by + 9.5);
  });

  y += Math.ceil(metaItems.length / 3) * 14 + 6;

  // Highlights
  if (plan?.eventSummary?.highlights && plan.eventSummary.highlights.length > 0) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...PRIMARY);
    doc.text("EXECUTIVE HIGHLIGHTS", margin, y);
    y += 5;

    plan.eventSummary.highlights.forEach((h) => {
      checkPageBreak(8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...TEXT_DARK);
      const hLines = doc.splitTextToSize(`✦  ${h}`, contentWidth - 4);
      doc.text(hLines, margin + 2, y);
      y += hLines.length * 4.5;
    });
    y += 6;
  }

  // ─── Section 1: Budget Allocation & Visual Breakdown ──────────────────────
  checkPageBreak(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...TEXT_DARK);
  doc.text("1. Budget Allocation & Category Distribution", margin, y);
  y += 6;

  const categories = plan?.budgetAllocation?.categories || [];
  const totalBudget = Number(intake.totalBudget) || 1;

  // Visual Multi-color Proportional Bar Chart
  const barColors = [
    [124, 92, 252], // Purple
    [236, 72, 153], // Pink
    [16, 185, 129], // Emerald
    [245, 158, 11], // Amber
    [59, 130, 246], // Blue
    [139, 92, 246], // Violet
    [14, 165, 233], // Sky
  ];

  let currentBarX = margin;
  categories.forEach((cat, idx) => {
    const fraction = (cat.amountINR || (cat.percentage / 100) * totalBudget) / totalBudget;
    const segW = fraction * contentWidth;
    const color = barColors[idx % barColors.length];
    doc.setFillColor(...color);
    doc.rect(currentBarX, y, segW, 6, "F");
    currentBarX += segW;
  });

  y += 10;

  // Budget Table Header
  doc.setFillColor(...ACCENT_BG);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("CATEGORY", margin + 3, y + 4.5);
  doc.text("SHARE", margin + 65, y + 4.5);
  doc.text("AMOUNT (INR)", margin + 85, y + 4.5);
  doc.text("PLANNING NOTES & SCOPE", margin + 115, y + 4.5);
  y += 7;

  // Table rows
  categories.forEach((cat, idx) => {
    checkPageBreak(12);
    const color = barColors[idx % barColors.length];
    doc.setFillColor(...color);
    doc.circle(margin + 4, y + 3.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_DARK);
    doc.text(cat.name, margin + 8, y + 4);

    doc.setFont("helvetica", "normal");
    doc.text(`${cat.percentage || Math.round((cat.amountINR / totalBudget) * 100)}%`, margin + 65, y + 4);

    doc.setFont("helvetica", "bold");
    doc.text(`₹${Number(cat.amountINR).toLocaleString("en-IN")}`, margin + 85, y + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...TEXT_MUTED);
    const noteLines = doc.splitTextToSize(cat.notes || "—", contentWidth - 118);
    doc.text(noteLines, margin + 115, y + 4);

    const rowH = Math.max(7, noteLines.length * 4);
    doc.setDrawColor(...BORDER_COLOR);
    doc.line(margin, y + rowH, margin + contentWidth, y + rowH);
    y += rowH;
  });

  // Total summary row
  checkPageBreak(8);
  doc.setFillColor(...ACCENT_BG);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT_DARK);
  doc.text("TOTAL ALLOCATED BUDGET", margin + 8, y + 4.8);
  doc.text("100%", margin + 65, y + 4.8);
  doc.text(`₹${totalBudget.toLocaleString("en-IN")}`, margin + 85, y + 4.8);
  y += 14;

  // ─── Section 2: Timeline Countdown Plan ───────────────────────────────────
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...TEXT_DARK);
  doc.text("2. Milestone Timeline & Countdown Action Plan", margin, y);
  y += 6;

  if (plan?.timeline?.isCompressed) {
    checkPageBreak(16);
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(248, 113, 113);
    doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(220, 38, 38);
    doc.text("⚠️ RUSH COMPRESSION ACTIVE:", margin + 3, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const compText = doc.splitTextToSize(plan.timeline.compressionNotice || "Planning window is shorter than ideal. Rush bookings activated.", contentWidth - 8);
    doc.text(compText, margin + 3, y + 8);
    y += 16;
  }

  const tasks = plan?.timeline?.tasks || [];
  tasks.forEach((task, idx) => {
    checkPageBreak(16);
    const isRisky = Boolean(task.isRisky);

    doc.setFillColor(isRisky ? 255 : 250, isRisky ? 245 : 250, isRisky ? 245 : 255);
    doc.setDrawColor(...(isRisky ? [239, 68, 68] : BORDER_COLOR));
    doc.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, "FD");

    // Countdown Badge
    doc.setFillColor(...(isRisky ? [239, 68, 68] : PRIMARY));
    doc.roundedRect(margin + 2, y + 2, 20, 9, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`T-${task.daysBeforeEvent}d`, margin + 12, y + 7.5, { align: "center" });

    // Task Title & Date
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(task.label, margin + 25, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    const dateStr = task.targetDate ? `Target: ${task.targetDate}` : "";
    doc.text(`${task.category || "General"} | ${dateStr}`, margin + 25, y + 9.5);

    // Urgency tag
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...(isRisky ? [220, 38, 38] : PRIMARY));
    doc.text(task.urgency || "STANDARD", pageWidth - margin - 4, y + 6, { align: "right" });

    y += 15;
  });

  y += 4;

  // ─── Section 3: Vendor Screening Checklist & Status Tracking ───────────────
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...TEXT_DARK);
  doc.text("3. Vendor Screening Checklist & Procurement Status", margin, y);
  y += 6;

  const vendorCats = plan?.vendorChecklist?.categories || [];
  vendorCats.forEach((vCat) => {
    checkPageBreak(35);
    const statusInfo = vendorStatuses[vCat.categoryName] || { status: "Not contacted", quotedAmount: 0 };

    doc.setFillColor(...ACCENT_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(margin, y, contentWidth, 8, 1, 1, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT_DARK);
    doc.text(vCat.categoryName, margin + 4, y + 5.2);

    // Status Pill
    const isBooked = statusInfo.status === "Booked";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...(isBooked ? SUCCESS_COLOR : WARNING_COLOR));
    doc.text(
      `Status: ${statusInfo.status.toUpperCase()} ${statusInfo.quotedAmount ? `(₹${Number(statusInfo.quotedAmount).toLocaleString("en-IN")})` : ""}`,
      pageWidth - margin - 4,
      y + 5.2,
      { align: "right" }
    );
    y += 10;

    // Screening questions
    if (vCat.questionsToAsk && vCat.questionsToAsk.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...PRIMARY);
      doc.text("Key Screening Questions to Ask:", margin + 4, y);
      y += 4;

      vCat.questionsToAsk.slice(0, 3).forEach((q) => {
        checkPageBreak(8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...TEXT_DARK);
        const qLines = doc.splitTextToSize(`• ${q}`, contentWidth - 10);
        doc.text(qLines, margin + 6, y);
        y += qLines.length * 3.8;
      });
      y += 2;
    }

    // Red Flags
    if (vCat.redFlags && vCat.redFlags.length > 0) {
      checkPageBreak(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(220, 38, 38);
      doc.text("Watch Out For (Red Flags):", margin + 4, y);
      y += 3.5;

      vCat.redFlags.slice(0, 2).forEach((rf) => {
        checkPageBreak(6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...TEXT_MUTED);
        const rfLines = doc.splitTextToSize(`⚠️  ${rf}`, contentWidth - 10);
        doc.text(rfLines, margin + 6, y);
        y += rfLines.length * 3.5;
      });
      y += 3;
    }
    y += 2;
  });

  // ─── Section 4: Personalized Ideas (Saved & Highlights) ───────────────────
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...TEXT_DARK);
  doc.text("4. Curated Creative Concepts & Personalized Ideas", margin, y);
  y += 6;

  const ideaSections = [
    { key: "themes", title: "Thematic Concepts 🎨" },
    { key: "decorIdeas", title: "Decor & Lighting Setups 🏮" },
    { key: "menuIdeas", title: "Curated Menu & Catering Stations 🍽️" },
    { key: "activityIdeas", title: "Guest Entertainment & Activities 🎭" },
  ];

  ideaSections.forEach(({ key, title }) => {
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY);
    doc.text(title, margin, y);
    y += 4.5;

    const items = plan?.personalizedIdeas?.[key] || [];
    items.slice(0, 4).forEach((idea, idx) => {
      checkPageBreak(12);
      const favKey = `${key}_${idea.title}`;
      const isFav = Boolean(savedFavorites[favKey]);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.8);
      doc.setTextColor(...TEXT_DARK);
      doc.text(`${isFav ? "⭐ " : ""}${idx + 1}. ${idea.title}${idea.tag ? ` [${idea.tag}]` : ""}`, margin + 3, y);
      y += 3.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(...TEXT_MUTED);
      const descLines = doc.splitTextToSize(idea.description, contentWidth - 8);
      doc.text(descLines, margin + 6, y);
      y += descLines.length * 3.5 + 2;
    });
    y += 3;
  });

  // Final page footer
  drawRunningFooter(pageNumber);

  // Generate clean filename
  const cleanTitle = (plan?.eventSummary?.title || "EventGenie_Plan")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 30);
  const fileName = `${cleanTitle}_EventGenie_Blueprint.pdf`;

  // Download
  doc.save(fileName);
  return { success: true, fileName };
}
