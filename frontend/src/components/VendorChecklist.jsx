import React from "react";

const STATUS_CONFIG = {
  not_contacted: {
    label: "Not Contacted",
    color: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.3)",
    icon: "⚪",
  },
  quoted: {
    label: "Quoted",
    color: "#fbbf24",
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.35)",
    icon: "🟡",
  },
  booked: {
    label: "Booked",
    color: "#34d399",
    bg: "rgba(16, 185, 129, 0.15)",
    border: "rgba(16, 185, 129, 0.35)",
    icon: "🟢",
  },
};

function fmt(n) {
  if (n === undefined || n === null || isNaN(n)) return "₹0";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function VendorChecklist({ vendorChecklist, budgetCategories = [], intake }) {
  const categories = vendorChecklist?.categories || [];

  // Storage key based on intake details
  const storageKey = React.useMemo(() => {
    const hash = `${intake?.eventType || "event"}_${intake?.eventDate || "date"}_${intake?.city || ""}`;
    return `eventgenie_vendors_${hash}`;
  }, [intake]);

  // Map budget categories by name lowercase for flexible lookup
  const budgetMap = React.useMemo(() => {
    const map = {};
    budgetCategories.forEach((b) => {
      map[b.name.toLowerCase()] = b;
    });
    return map;
  }, [budgetCategories]);

  // Find matching budget allocation for a vendor category
  function findBudget(categoryName) {
    if (!categoryName) return null;
    const lower = categoryName.toLowerCase();
    // Direct match
    if (budgetMap[lower]) return budgetMap[lower];
    // Keyword match
    for (const b of budgetCategories) {
      const bLower = b.name.toLowerCase();
      if (
        lower.includes("venue") && bLower.includes("venue") ||
        lower.includes("cater") && bLower.includes("cater") ||
        lower.includes("decor") && bLower.includes("decor") ||
        lower.includes("photo") && bLower.includes("photo") ||
        lower.includes("entertain") && bLower.includes("entertain") ||
        lower.includes("sound") && bLower.includes("sound") ||
        lower.includes("attire") && bLower.includes("attire") ||
        lower.includes("misc") && bLower.includes("misc")
      ) {
        return b;
      }
    }
    return null;
  }

  // Load saved vendor state or initialize defaults
  const [vendorData, setVendorData] = React.useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Failed to read vendor storage:", e);
    }

    // Default structure: one slot per category
    const initial = {};
    categories.forEach((cat) => {
      initial[cat.id] = {
        vendorName: "",
        status: "not_contacted", // 'not_contacted' | 'quoted' | 'booked'
        quotedAmount: "",
        bookedAmount: "",
        notes: "",
        tickedQuestions: [],
        tickedDocuments: [],
      };
    });
    return initial;
  });

  // Persist whenever vendorData changes
  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(vendorData));
    } catch (e) {
      console.warn("Failed to persist vendor data:", e);
    }
  }, [vendorData, storageKey]);

  function updateSlot(catId, field, value) {
    setVendorData((prev) => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || {
          vendorName: "",
          status: "not_contacted",
          quotedAmount: "",
          bookedAmount: "",
          notes: "",
          tickedQuestions: [],
          tickedDocuments: [],
        }),
        [field]: value,
      },
    }));
  }

  function toggleItem(catId, listKey, idx) {
    setVendorData((prev) => {
      const currentSlot = prev[catId] || {};
      const list = currentSlot[listKey] || [];
      const updatedList = list.includes(idx)
        ? list.filter((i) => i !== idx)
        : [...list, idx];
      return {
        ...prev,
        [catId]: {
          ...currentSlot,
          [listKey]: updatedList,
        },
      };
    });
  }

  // Active accordion tabs per card: 'questions' | 'docs' | 'redflags'
  const [activeSubTab, setActiveSubTab] = React.useState({});

  function setSubTab(catId, tabName) {
    setActiveSubTab((prev) => ({ ...prev, [catId]: tabName }));
  }

  // Filter: 'all' | 'not_contacted' | 'quoted' | 'booked' | 'over_budget'
  const [statusFilter, setStatusFilter] = React.useState("all");

  // Calculate totals
  let totalAllocated = 0;
  let totalBooked = 0;
  let totalQuoted = 0;
  let bookedCount = 0;
  let overBudgetCount = 0;

  categories.forEach((cat) => {
    const slot = vendorData[cat.id] || {};
    const b = findBudget(cat.categoryName);
    const allocated = b ? Number(b.amountINR) || 0 : 0;
    totalAllocated += allocated;

    const bookedAmt = slot.status === "booked" ? Number(slot.bookedAmount || slot.quotedAmount) || 0 : 0;
    const quotedAmt = Number(slot.quotedAmount) || 0;

    totalBooked += bookedAmt;
    totalQuoted += quotedAmt;

    if (slot.status === "booked") bookedCount++;
    if (allocated > 0 && bookedAmt > allocated) overBudgetCount++;
  });

  const totalBudget = intake?.totalBudget || totalAllocated;

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    const slot = vendorData[cat.id] || {};
    const b = findBudget(cat.categoryName);
    const allocated = b ? Number(b.amountINR) || 0 : 0;
    const bookedAmt = slot.status === "booked" ? Number(slot.bookedAmount || slot.quotedAmount) || 0 : 0;

    if (statusFilter === "over_budget") {
      return allocated > 0 && bookedAmt > allocated;
    }
    if (statusFilter !== "all") {
      return (slot.status || "not_contacted") === statusFilter;
    }
    return true;
  });

  return (
    <section className="fade-in-up" style={{ maxWidth: 940, margin: "0 auto" }}>
      {/* ── Section Header ───────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Outfit,sans-serif",
              fontSize: "1.7rem",
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            📋 Vendor Checklist &amp; Sourcing Tracker
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
            Event-tailored screening questions, contracts to collect &amp; red flags — with live budget variance tracking.
          </p>
        </div>

        {/* Global booked summary */}
        <div
          className="glass-card"
          style={{
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderColor: totalBooked > totalBudget ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)",
            background: totalBooked > totalBudget ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: totalBooked > totalBudget ? "#ef4444" : "#10b981",
              boxShadow: totalBooked > totalBudget
                ? "0 0 10px rgba(239,68,68,0.8)"
                : "0 0 10px rgba(16,185,129,0.8)",
            }}
          />
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Total Booked
            </div>
            <div style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.05rem" }}>
              {fmt(totalBooked)} &nbsp;
              <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-muted)" }}>
                / {fmt(totalBudget)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Global Budget vs Booked Health Banner ───────────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: "20px 24px",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
              Total Event Budget
            </div>
            <div style={{ fontFamily: "Outfit,sans-serif", fontSize: "1.25rem", fontWeight: 800 }}>
              {fmt(totalBudget)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
              Booked Commitments
            </div>
            <div
              style={{
                fontFamily: "Outfit,sans-serif",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: totalBooked > totalBudget ? "#ef4444" : "#10b981",
              }}
            >
              {fmt(totalBooked)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
              Remaining Cushion
            </div>
            <div
              style={{
                fontFamily: "Outfit,sans-serif",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: totalBudget - totalBooked < 0 ? "#ef4444" : "var(--color-primary-light)",
              }}
            >
              {fmt(totalBudget - totalBooked)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
              Vendors Finalized
            </div>
            <div style={{ fontFamily: "Outfit,sans-serif", fontSize: "1.25rem", fontWeight: 800 }}>
              {bookedCount} of {categories.length} Booked
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              height: 8,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, Math.round((totalBooked / (totalBudget || 1)) * 100))}%`,
                background:
                  totalBooked > totalBudget
                    ? "linear-gradient(90deg, #ef4444, #f87171)"
                    : "linear-gradient(90deg, #10b981, #34d399)",
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { id: "all", label: `All Categories (${categories.length})` },
            { id: "not_contacted", label: "⚪ Not Contacted" },
            { id: "quoted", label: "🟡 Quoted" },
            { id: "booked", label: "🟢 Booked" },
            ...(overBudgetCount > 0
              ? [{ id: "over_budget", label: `⚠️ Over Budget (${overBudgetCount})` }]
              : []),
          ].map((f) => {
            const active = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: active
                    ? "1px solid var(--color-primary)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: active
                    ? "rgba(124, 92, 252, 0.25)"
                    : "rgba(255,255,255,0.03)",
                  color: active ? "var(--color-primary-light)" : "var(--color-text-muted)",
                  transition: "all 0.2s",
                }}
                id={`vendor-filter-${f.id}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Vendor Category Cards ────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {filteredCategories.map((cat, idx) => {
          const slot = vendorData[cat.id] || {
            vendorName: "",
            status: "not_contacted",
            quotedAmount: "",
            bookedAmount: "",
            notes: "",
            tickedQuestions: [],
            tickedDocuments: [],
          };

          const budgetItem = findBudget(cat.categoryName);
          const allocatedINR = budgetItem ? Number(budgetItem.amountINR) || 0 : 0;
          const currentStatus = slot.status || "not_contacted";
          const statusMeta = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.not_contacted;

          // Amount to evaluate against budget
          const activeAmt =
            currentStatus === "booked"
              ? Number(slot.bookedAmount || slot.quotedAmount) || 0
              : Number(slot.quotedAmount) || 0;

          const isOverBudget = allocatedINR > 0 && activeAmt > allocatedINR;
          const variance = activeAmt - allocatedINR;
          const currentSubTab = activeSubTab[cat.id] || "questions";

          return (
            <div
              key={cat.id || idx}
              className="glass-card"
              style={{
                padding: "24px 26px",
                borderColor: isOverBudget
                  ? "rgba(239,68,68,0.4)"
                  : currentStatus === "booked"
                  ? "rgba(16,185,129,0.35)"
                  : "var(--color-border)",
                background: isOverBudget
                  ? "linear-gradient(180deg, rgba(239,68,68,0.05), rgba(255,255,255,0.02))"
                  : "var(--color-surface)",
                transition: "all 0.25s ease",
              }}
              id={`vendor-card-${cat.id}`}
            >
              {/* ── Top Header Row: Category name + Budget vs Booked status ── */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 18,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  paddingBottom: 14,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <h3
                      style={{
                        fontFamily: "Outfit,sans-serif",
                        fontSize: "1.25rem",
                        fontWeight: 800,
                      }}
                    >
                      {cat.categoryName}
                    </h3>

                    {/* Status Pill */}
                    <span
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: statusMeta.bg,
                        border: `1px solid ${statusMeta.border}`,
                        color: statusMeta.color,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>{statusMeta.icon}</span>
                      {statusMeta.label}
                    </span>

                    {/* Over budget alert badge */}
                    {isOverBudget && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 999,
                          background: "rgba(239,68,68,0.2)",
                          border: "1px solid rgba(239,68,68,0.5)",
                          color: "#f87171",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        ⚠️ Over by {fmt(variance)}
                      </span>
                    )}
                  </div>

                  {budgetItem && (
                    <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginTop: 4 }}>
                      Allocated Budget (Phase 2):{" "}
                      <strong style={{ color: "var(--color-primary-light)" }}>{fmt(allocatedINR)}</strong>
                      {budgetItem.percentage && ` (${budgetItem.percentage}% of total)`}
                    </p>
                  )}
                </div>

                {/* Status Switcher Buttons */}
                <div style={{ display: "flex", gap: 6, background: "rgba(255,255,255,0.03)", padding: 4, borderRadius: 10 }}>
                  {[
                    { id: "not_contacted", label: "Not Contacted" },
                    { id: "quoted", label: "Quoted" },
                    { id: "booked", label: "Booked" },
                  ].map((s) => {
                    const isSelected = currentStatus === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => updateSlot(cat.id, "status", s.id)}
                        style={{
                          padding: "5px 12px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          borderRadius: 6,
                          cursor: "pointer",
                          border: "none",
                          background: isSelected
                            ? STATUS_CONFIG[s.id].bg
                            : "transparent",
                          color: isSelected
                            ? STATUS_CONFIG[s.id].color
                            : "var(--color-text-muted)",
                          boxShadow: isSelected
                            ? `0 0 10px ${STATUS_CONFIG[s.id].border}`
                            : "none",
                          transition: "all 0.2s",
                        }}
                        id={`vendor-status-${cat.id}-${s.id}`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Vendor Details Inputs (User Sourcing Info) ────────── */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 20,
                  background: "rgba(255,255,255,0.02)",
                  padding: "16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {/* Vendor Name */}
                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Vendor / Agency Name
                  </label>
                  <input
                    type="text"
                    value={slot.vendorName || ""}
                    onChange={(e) => updateSlot(cat.id, "vendorName", e.target.value)}
                    placeholder="e.g. Royal Rajputana Banquets"
                    className="form-input"
                    style={{ fontSize: "0.88rem", padding: "8px 12px" }}
                    id={`vendor-name-input-${cat.id}`}
                  />
                </div>

                {/* Quoted Amount */}
                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Quoted Amount (INR)
                  </label>
                  <input
                    type="number"
                    value={slot.quotedAmount || ""}
                    onChange={(e) => updateSlot(cat.id, "quotedAmount", e.target.value)}
                    placeholder="e.g. 850000"
                    className="form-input"
                    style={{ fontSize: "0.88rem", padding: "8px 12px" }}
                    id={`vendor-quote-input-${cat.id}`}
                  />
                </div>

                {/* Booked Final Amount */}
                {currentStatus === "booked" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 600, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                      Final Booked Amount (INR)
                    </label>
                    <input
                      type="number"
                      value={slot.bookedAmount || ""}
                      onChange={(e) => updateSlot(cat.id, "bookedAmount", e.target.value)}
                      placeholder={slot.quotedAmount || "e.g. 800000"}
                      className="form-input"
                      style={{
                        fontSize: "0.88rem",
                        padding: "8px 12px",
                        borderColor: isOverBudget ? "rgba(239,68,68,0.5)" : "rgba(16,185,129,0.5)",
                      }}
                      id={`vendor-booked-input-${cat.id}`}
                    />
                  </div>
                )}

                {/* Notes */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Notes &amp; Inclusions (e.g. deposit paid, curfew hours, menu items)
                  </label>
                  <input
                    type="text"
                    value={slot.notes || ""}
                    onChange={(e) => updateSlot(cat.id, "notes", e.target.value)}
                    placeholder="e.g. Includes 50% advance on signing, stage lights included, 11 PM cutoff"
                    className="form-input"
                    style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                    id={`vendor-notes-input-${cat.id}`}
                  />
                </div>
              </div>

              {/* ── Subtabs: Questions | Documents | Red Flags ───────── */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[
                  { id: "questions", label: `❓ Questions to Ask (${cat.questionsToAsk?.length || 0})` },
                  { id: "docs", label: `📄 Documents to Collect (${cat.documentsToCollect?.length || 0})` },
                  { id: "redflags", label: `🚩 Red Flags (${cat.redFlags?.length || 0})` },
                ].map((st) => {
                  const active = currentSubTab === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSubTab(cat.id, st.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: active
                          ? "1px solid var(--color-primary)"
                          : "1px solid rgba(255,255,255,0.06)",
                        background: active
                          ? "rgba(124, 92, 252, 0.2)"
                          : "rgba(255,255,255,0.02)",
                        color: active ? "var(--color-primary-light)" : "var(--color-text-muted)",
                        transition: "all 0.2s",
                      }}
                      id={`subtab-${cat.id}-${st.id}`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>

              {/* ── Subtab Content ── */}
              {currentSubTab === "questions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {cat.questionsToAsk?.map((q, qIdx) => {
                    const ticked = (slot.tickedQuestions || []).includes(qIdx);
                    return (
                      <label
                        key={qIdx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          fontSize: "0.86rem",
                          lineHeight: 1.45,
                          cursor: "pointer",
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: ticked ? "rgba(16,185,129,0.04)" : "transparent",
                          color: ticked ? "var(--color-text-muted)" : "var(--color-text-main)",
                          textDecoration: ticked ? "line-through" : "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={ticked}
                          onChange={() => toggleItem(cat.id, "tickedQuestions", qIdx)}
                          style={{
                            marginTop: 2,
                            accentColor: "var(--color-primary)",
                            cursor: "pointer",
                          }}
                        />
                        <span>{q}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentSubTab === "docs" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {cat.documentsToCollect?.map((doc, dIdx) => {
                    const ticked = (slot.tickedDocuments || []).includes(dIdx);
                    return (
                      <label
                        key={dIdx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          fontSize: "0.86rem",
                          lineHeight: 1.45,
                          cursor: "pointer",
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: ticked ? "rgba(16,185,129,0.04)" : "transparent",
                          color: ticked ? "var(--color-text-muted)" : "var(--color-text-main)",
                          textDecoration: ticked ? "line-through" : "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={ticked}
                          onChange={() => toggleItem(cat.id, "tickedDocuments", dIdx)}
                          style={{
                            marginTop: 2,
                            accentColor: "#38bdf8",
                            cursor: "pointer",
                          }}
                        />
                        <span>📄 {doc}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {currentSubTab === "redflags" && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    borderRadius: 10,
                    padding: "14px 18px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#f87171", fontWeight: 700, fontSize: "0.85rem", marginBottom: 8 }}>
                    <span>🚩</span> Red Flags to Watch For in Negotiations
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                    {cat.redFlags?.map((flag, fIdx) => (
                      <li key={fIdx} style={{ fontSize: "0.84rem", color: "#fca5a5", lineHeight: 1.45 }}>
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
