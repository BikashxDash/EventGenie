import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Palette — one colour per budget category (up to 8) ───────────────────
const PALETTE = [
  "#7c5cfc", // purple   – venue
  "#f472b6", // pink     – catering
  "#f59e0b", // amber    – decor
  "#10b981", // emerald  – photography
  "#38bdf8", // sky      – entertainment
  "#fb923c", // orange   – misc
  "#a78bfa", // lavender – attire
  "#34d399", // teal     – logistics
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmt(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// Custom tooltip for the pie chart
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "rgba(18,18,28,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 12,
        padding: "12px 16px",
        minWidth: 180,
      }}
    >
      <p
        style={{
          fontFamily: "Outfit,sans-serif",
          fontWeight: 700,
          fontSize: "0.95rem",
          color: d.fill,
          marginBottom: 4,
        }}
      >
        {d.name}
      </p>
      <p style={{ color: "#f1f1f8", fontSize: "0.9rem" }}>
        {d.percentage.toFixed(1)}% &nbsp;·&nbsp; {fmt(d.amountINR)}
      </p>
      {d.notes && (
        <p
          style={{
            color: "#8a8aaa",
            fontSize: "0.75rem",
            marginTop: 6,
            lineHeight: 1.4,
            maxWidth: 220,
          }}
        >
          {d.notes}
        </p>
      )}
    </div>
  );
}

// Custom legend
function CustomLegend({ payload }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px 16px",
        justifyContent: "center",
        marginTop: 12,
      }}
    >
      {payload.map((entry) => (
        <div
          key={entry.value}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "0.78rem", color: "#8a8aaa" }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function BudgetPlanner({ categories: initial, totalBudget, onUpdate }) {
  // Local editable state — percentage + lock flag per category
  const [cats, setCats] = React.useState(() =>
    initial.map((c, i) => ({
      ...c,
      percentage: Number(c.percentage),
      amountINR: Number(c.amountINR),
      fill: PALETTE[i % PALETTE.length],
      locked: false,
    }))
  );

  const [activeIndex, setActiveIndex] = React.useState(null);
  const [edited, setEdited] = React.useState(false);

  // Keep parent updated
  React.useEffect(() => {
    if (edited) onUpdate?.(cats);
  }, [cats, edited]);

  // ── Recompute amounts whenever percentages change ──────────────────────
  function recompute(updated) {
    return updated.map((c) => ({
      ...c,
      amountINR: Math.round((c.percentage / 100) * totalBudget),
    }));
  }

  // ── Handle slider change for index i ──────────────────────────────────
  function handleSlider(i, rawVal) {
    const newPct = clamp(Number(rawVal), 1, 95);
    setCats((prev) => {
      const next = [...prev];
      const old = next[i].percentage;
      const delta = newPct - old;

      // Unlock targets: all unlocked cats except i
      const targets = next
        .map((c, idx) => ({ idx, c }))
        .filter(({ idx, c }) => idx !== i && !c.locked);

      if (!targets.length) return prev; // all locked — can't redistribute

      // Total pct of targets
      const targetSum = targets.reduce((s, { c }) => s + c.percentage, 0);
      if (targetSum <= 0) return prev;

      // Distribute delta proportionally among targets
      let remainder = -delta;
      targets.forEach(({ idx }, ti) => {
        const share =
          ti === targets.length - 1
            ? remainder // give leftover to last
            : Math.round(
                (-delta * next[idx].percentage) / targetSum
              );
        next[idx] = {
          ...next[idx],
          percentage: clamp(next[idx].percentage + share, 1, 95),
        };
        remainder -= share;
      });

      next[i] = { ...next[i], percentage: newPct };

      // Snap total to exactly 100
      const sum = next.reduce((s, c) => s + c.percentage, 0);
      if (sum !== 100 && targets.length) {
        const lastTarget = targets[targets.length - 1].idx;
        next[lastTarget] = {
          ...next[lastTarget],
          percentage: clamp(next[lastTarget].percentage + (100 - sum), 1, 95),
        };
      }

      return recompute(next);
    });
    setEdited(true);
  }

  // ── Toggle lock ────────────────────────────────────────────────────────
  function toggleLock(i) {
    setCats((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], locked: !next[i].locked };
      return next;
    });
  }

  // ── Reset to AI values ─────────────────────────────────────────────────
  function handleReset() {
    setCats(
      initial.map((c, i) => ({
        ...c,
        percentage: Number(c.percentage),
        amountINR: Number(c.amountINR),
        fill: PALETTE[i % PALETTE.length],
        locked: false,
      }))
    );
    setEdited(false);
  }

  const totalPct = cats.reduce((s, c) => s + c.percentage, 0);
  const totalAmt = cats.reduce((s, c) => s + c.amountINR, 0);
  const perfect = Math.round(totalPct) === 100;

  return (
    <section className="fade-in-up">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Outfit,sans-serif",
              fontSize: "1.6rem",
              fontWeight: 800,
              marginBottom: 4,
            }}
          >
            💰 Budget Planner
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            AI-suggested split · drag sliders to customise
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Total integrity badge */}
          <span
            className="chip"
            style={{
              borderColor: perfect
                ? "rgba(16,185,129,0.4)"
                : "rgba(239,68,68,0.4)",
              color: perfect ? "#10b981" : "#ef4444",
              background: perfect
                ? "rgba(16,185,129,0.1)"
                : "rgba(239,68,68,0.1)",
            }}
          >
            {perfect ? "✓" : "⚠"} {totalPct.toFixed(0)}%
          </span>
          {edited && (
            <button
              onClick={handleReset}
              className="btn-secondary"
              style={{ padding: "8px 16px", fontSize: "0.8rem" }}
              id="budget-reset-btn"
            >
              ↺ Reset to AI
            </button>
          )}
        </div>
      </div>

      {/* ── Two-column layout ───────────────────────────────────────────── */}
      <div
        className="budget-two-col"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px,420px) 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* ── Pie chart ── */}
        <div className="glass-card" style={{ padding: "28px 20px" }}>
          <p
            style={{
              fontFamily: "Outfit,sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Total Budget
          </p>
          <p
            className="gradient-text"
            style={{
              fontFamily: "Outfit,sans-serif",
              fontSize: "1.8rem",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            {fmt(totalBudget)}
          </p>

          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={cats}
                dataKey="percentage"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={105}
                paddingAngle={3}
                onMouseEnter={(_, idx) => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                stroke="none"
              >
                {cats.map((cat, i) => (
                  <Cell
                    key={cat.name}
                    fill={cat.fill}
                    opacity={
                      activeIndex === null || activeIndex === i ? 1 : 0.45
                    }
                    style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Centre label when hovering */}
          {activeIndex !== null && (
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <span style={{ color: cats[activeIndex].fill, fontWeight: 700 }}>
                {cats[activeIndex].name}
              </span>
            </div>
          )}

          {/* Computed vs target total */}
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.82rem",
              color: "var(--color-text-muted)",
            }}
          >
            <span>Allocated</span>
            <span
              style={{
                color:
                  Math.abs(totalAmt - totalBudget) < 10
                    ? "#10b981"
                    : "#ef4444",
                fontWeight: 700,
              }}
            >
              {fmt(totalAmt)}
            </span>
          </div>
        </div>

        {/* ── Sliders ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {cats.map((cat, i) => (
            <div
              key={cat.name}
              className="glass-card"
              style={{
                padding: "18px 20px",
                borderColor: activeIndex === i
                  ? cat.fill + "55"
                  : "var(--color-border)",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* Row 1: name + lock + amount */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Colour dot */}
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: cat.fill,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "Outfit,sans-serif",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  >
                    {cat.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Lock toggle */}
                  <button
                    onClick={() => toggleLock(i)}
                    title={cat.locked ? "Unlock this category" : "Lock this category"}
                    style={{
                      background: cat.locked
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(255,255,255,0.05)",
                      border: `1px solid ${
                        cat.locked
                          ? "rgba(245,158,11,0.4)"
                          : "rgba(255,255,255,0.1)"
                      }`,
                      borderRadius: 6,
                      padding: "3px 8px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      color: cat.locked ? "#f59e0b" : "var(--color-text-muted)",
                      transition: "all 0.2s",
                    }}
                    id={`lock-cat-${i}`}
                  >
                    {cat.locked ? "🔒" : "🔓"}
                  </button>
                  {/* Amount */}
                  <span
                    style={{
                      fontFamily: "Outfit,sans-serif",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: cat.fill,
                      minWidth: 100,
                      textAlign: "right",
                    }}
                  >
                    {fmt(cat.amountINR)}
                  </span>
                </div>
              </div>

              {/* Row 2: slider + percentage */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="range"
                  min={1}
                  max={95}
                  step={1}
                  value={cat.percentage}
                  disabled={cat.locked}
                  onChange={(e) => handleSlider(i, e.target.value)}
                  id={`slider-cat-${i}`}
                  style={{
                    flex: 1,
                    accentColor: cat.fill,
                    opacity: cat.locked ? 0.4 : 1,
                    cursor: cat.locked ? "not-allowed" : "pointer",
                    height: 6,
                  }}
                />
                <span
                  style={{
                    fontFamily: "Outfit,sans-serif",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "var(--color-text-muted)",
                    minWidth: 40,
                    textAlign: "right",
                  }}
                >
                  {cat.percentage.toFixed(0)}%
                </span>
              </div>

              {/* Notes */}
              {cat.notes && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {cat.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Responsive grid for mobile ─────────────────────────────────── */}
      <style>{`
        @media (max-width: 700px) {
          .budget-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
