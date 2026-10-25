import React from "react";

// ── Urgency badge colors & styles ──────────────────────────────────────────
const URGENCY_CONFIG = {
  CRITICAL: {
    label: "Critical / Rush",
    badgeBg: "rgba(239, 68, 68, 0.15)",
    badgeBorder: "rgba(239, 68, 68, 0.4)",
    badgeColor: "#f87171",
    dotColor: "#ef4444",
  },
  HIGH: {
    label: "High Priority",
    badgeBg: "rgba(245, 158, 11, 0.15)",
    badgeBorder: "rgba(245, 158, 11, 0.4)",
    badgeColor: "#fbbf24",
    dotColor: "#f59e0b",
  },
  MEDIUM: {
    label: "Medium Priority",
    badgeBg: "rgba(124, 92, 252, 0.15)",
    badgeBorder: "rgba(124, 92, 252, 0.35)",
    badgeColor: "#a78bfa",
    dotColor: "#7c5cfc",
  },
  LOW: {
    label: "Low Priority",
    badgeBg: "rgba(16, 185, 129, 0.15)",
    badgeBorder: "rgba(16, 185, 129, 0.35)",
    badgeColor: "#34d399",
    dotColor: "#10b981",
  },
};

function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function TimelineGenerator({ timeline, intake }) {
  const {
    tasks = [],
    isCompressed = false,
    compressionNotice = "",
    idealLeadDays = 90,
    actualDaysRemaining = 0,
  } = timeline || {};

  // Persistence key based on intake details
  const storageKey = React.useMemo(() => {
    const hash = `${intake?.eventType || "event"}_${intake?.eventDate || "date"}_${intake?.city || ""}`;
    return `eventgenie_timeline_completed_${hash}`;
  }, [intake]);

  // Load persisted completed tasks
  const [completedIds, setCompletedIds] = React.useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active filter: 'all' | 'pending' | 'completed' | 'risky'
  const [filter, setFilter] = React.useState("all");

  // Save to localStorage whenever completedIds changes
  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(completedIds));
    } catch (e) {
      console.warn("Failed to persist timeline progress:", e);
    }
  }, [completedIds, storageKey]);

  function toggleTask(id) {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleMarkAll() {
    if (completedIds.length === tasks.length) {
      setCompletedIds([]);
    } else {
      setCompletedIds(tasks.map((t) => t.id));
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const isDone = completedIds.includes(task.id);
    if (filter === "pending") return !isDone;
    if (filter === "completed") return isDone;
    if (filter === "risky") return task.isRisky;
    return true;
  });

  const totalTasks = tasks.length;
  const completedCount = completedIds.length;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const riskyCount = tasks.filter((t) => t.isRisky).length;

  return (
    <section className="fade-in-up" style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* ── Section Title & Countdown Summary ────────────────────────── */}
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
            ⏳ Countdown Task Timeline
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem" }}>
            Countdown-based milestone plan calculated from your target event date:{" "}
            <strong style={{ color: "var(--color-text-main)" }}>
              {formatDate(intake?.eventDate)}
            </strong>
          </p>
        </div>

        {/* Days remaining badge */}
        <div
          className="glass-card"
          style={{
            padding: "8px 18px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderColor: isCompressed ? "rgba(239,68,68,0.4)" : "rgba(124,92,252,0.4)",
            background: isCompressed ? "rgba(239,68,68,0.08)" : "rgba(124,92,252,0.08)",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: isCompressed ? "#ef4444" : "#10b981",
              boxShadow: isCompressed
                ? "0 0 10px rgba(239,68,68,0.8)"
                : "0 0 10px rgba(16,185,129,0.8)",
            }}
          />
          <div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Event Countdown
            </div>
            <div style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.05rem" }}>
              T-{actualDaysRemaining} Days &nbsp;
              <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--color-text-muted)" }}>
                ({actualDaysRemaining === 0 ? "Today!" : `${actualDaysRemaining} days away`})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Compression Banner (Condition 1: Accelerated vs Condition 2: Optimal) ── */}
      {isCompressed ? (
        <div
          className="glass-card"
          style={{
            padding: "20px 24px",
            marginBottom: 28,
            borderColor: "rgba(245, 158, 11, 0.4)",
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08))",
          }}
          id="compression-alert-banner"
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                <h4 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 800, fontSize: "1.05rem", color: "#fbbf24" }}>
                  Accelerated Timeline Compression Active
                </h4>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "rgba(239,68,68,0.25)",
                    color: "#f87171",
                    border: "1px solid rgba(239,68,68,0.4)",
                  }}
                >
                  {actualDaysRemaining} Days Runway vs {idealLeadDays} Days Ideal
                </span>
              </div>
              <p style={{ fontSize: "0.88rem", color: "#e2e8f0", lineHeight: 1.55, marginBottom: 8 }}>
                {compressionNotice ||
                  `Standard planning for this event recommends ${idealLeadDays} days. With only ${actualDaysRemaining} days remaining, non-essential preparation steps have been compressed into rapid emergency milestones.`}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: "0.78rem", color: "#fbbf24" }}>
                <span>🚨 {riskyCount} high-risk tasks marked with warnings</span>
                <span>•</span>
                <span>⚡ Instant vendor lock-in recommended</span>
                <span>•</span>
                <span>📲 Digital communications prioritized over print</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="glass-card"
          style={{
            padding: "16px 20px",
            marginBottom: 28,
            borderColor: "rgba(16, 185, 129, 0.35)",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(56, 189, 248, 0.05))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "1.4rem" }}>✨</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: "#34d399", fontSize: "0.92rem" }}>
                Optimal Planning Runway ({actualDaysRemaining} Days Available)
              </span>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", marginTop: 2 }}>
                You have sufficient runway (ideal: {idealLeadDays} days) to execute this plan calmly without compressed rush fees.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Progress Bar & Filter Header ───────────────────────────── */}
      <div
        className="glass-card"
        style={{
          padding: "20px 24px",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <span style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
              Milestone Progress:
            </span>{" "}
            <span style={{ color: progressPct === 100 ? "#10b981" : "var(--color-primary-light)", fontWeight: 700 }}>
              {completedCount} of {totalTasks} completed ({progressPct}%)
            </span>
          </div>
          <button
            onClick={handleMarkAll}
            className="btn-secondary"
            style={{ padding: "5px 12px", fontSize: "0.75rem" }}
            id="timeline-mark-all-btn"
          >
            {completedCount === totalTasks ? "↺ Uncheck All" : "✓ Mark All Done"}
          </button>
        </div>

        {/* Bar */}
        <div
          style={{
            height: 8,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background:
                progressPct === 100
                  ? "linear-gradient(90deg, #10b981, #34d399)"
                  : "linear-gradient(90deg, var(--color-primary), var(--color-primary-light))",
              borderRadius: 999,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Filter buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {[
            { id: "all", label: `All Tasks (${totalTasks})` },
            { id: "pending", label: `Pending (${totalTasks - completedCount})` },
            { id: "completed", label: `Completed (${completedCount})` },
            { id: "risky", label: `⚠️ High Risk (${riskyCount})` },
          ].map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
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
                id={`timeline-filter-${f.id}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Timeline Task Cards Track ──────────────────────────────── */}
      <div style={{ position: "relative", paddingLeft: 32 }}>
        {/* Continuous vertical line */}
        <div
          style={{
            position: "absolute",
            left: 11,
            top: 16,
            bottom: 24,
            width: 2,
            background: "linear-gradient(180deg, var(--color-primary), rgba(124,92,252,0.15))",
          }}
        />

        {filteredTasks.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-muted)" }}
          >
            No tasks match the selected filter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {filteredTasks.map((task, idx) => {
              const isDone = completedIds.includes(task.id);
              const urgency = URGENCY_CONFIG[task.urgency?.toUpperCase()] || URGENCY_CONFIG.MEDIUM;
              const isEventDay = task.daysBeforeEvent === 0;

              return (
                <div
                  key={task.id || idx}
                  style={{ position: "relative" }}
                  className="timeline-item"
                >
                  {/* Glowing timeline node dot */}
                  <div
                    onClick={() => toggleTask(task.id)}
                    style={{
                      position: "absolute",
                      left: -32,
                      top: 20,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: isDone
                        ? "#10b981"
                        : task.isRisky
                        ? "#ef4444"
                        : isEventDay
                        ? "#f59e0b"
                        : "var(--color-primary)",
                      border: "3px solid #0d0d16",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: isDone
                        ? "0 0 12px rgba(16,185,129,0.8)"
                        : task.isRisky
                        ? "0 0 12px rgba(239,68,68,0.8)"
                        : "0 0 10px rgba(124,92,252,0.5)",
                      transition: "all 0.25s",
                      zIndex: 2,
                    }}
                    title={isDone ? "Completed! Click to uncheck" : "Click to mark done"}
                  >
                    {isDone ? (
                      <span style={{ fontSize: "0.75rem", color: "#fff", fontWeight: 900 }}>✓</span>
                    ) : (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "#fff",
                        }}
                      />
                    )}
                  </div>

                  {/* Task Card */}
                  <div
                    className="glass-card"
                    style={{
                      padding: "18px 22px",
                      borderColor: isDone
                        ? "rgba(16,185,129,0.25)"
                        : task.isRisky
                        ? "rgba(239,68,68,0.35)"
                        : "var(--color-border)",
                      background: isDone
                        ? "rgba(16,185,129,0.03)"
                        : task.isRisky
                        ? "rgba(239,68,68,0.03)"
                        : "var(--color-surface)",
                      opacity: isDone ? 0.72 : 1,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {/* Top Row: Milestone time + Category + Urgency */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {/* Countdown Tag */}
                        <span
                          style={{
                            fontFamily: "Outfit,sans-serif",
                            fontWeight: 800,
                            fontSize: "0.85rem",
                            padding: "3px 10px",
                            borderRadius: 6,
                            background: isEventDay
                              ? "rgba(245,158,11,0.2)"
                              : "rgba(124,92,252,0.2)",
                            color: isEventDay ? "#fbbf24" : "var(--color-primary-light)",
                            border: isEventDay
                              ? "1px solid rgba(245,158,11,0.4)"
                              : "1px solid rgba(124,92,252,0.3)",
                          }}
                        >
                          {isEventDay ? "🎉 T-0 (EVENT DAY)" : `T-${task.daysBeforeEvent} DAYS`}
                        </span>

                        {/* Calendar Target Date */}
                        {task.targetDate && (
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                            📅 {formatDate(task.targetDate)}
                          </span>
                        )}

                        {/* Category */}
                        {task.category && (
                          <span className="chip" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                            {task.category}
                          </span>
                        )}
                      </div>

                      {/* Urgency Badge */}
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 10px",
                          borderRadius: 999,
                          background: urgency.badgeBg,
                          border: `1px solid ${urgency.badgeBorder}`,
                          color: urgency.badgeColor,
                        }}
                      >
                        {urgency.label}
                      </span>
                    </div>

                    {/* Middle Row: Checkbox + Label */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleTask(task.id)}
                        id={`task-check-${task.id}`}
                        style={{
                          marginTop: 3,
                          width: 18,
                          height: 18,
                          cursor: "pointer",
                          accentColor: "var(--color-primary)",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            fontFamily: "Outfit,sans-serif",
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            marginBottom: 4,
                            textDecoration: isDone ? "line-through" : "none",
                            color: isDone ? "var(--color-text-muted)" : "var(--color-text-main)",
                          }}
                        >
                          {task.label}
                        </h4>
                        <p
                          style={{
                            fontSize: "0.88rem",
                            color: "var(--color-text-muted)",
                            lineHeight: 1.5,
                            marginBottom: task.isRisky && task.riskWarning ? 10 : 0,
                          }}
                        >
                          {task.description}
                        </p>

                        {/* High Risk Warning Callout */}
                        {task.isRisky && task.riskWarning && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: "8px 12px",
                              background: "rgba(239, 68, 68, 0.12)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: 8,
                              fontSize: "0.8rem",
                              color: "#fca5a5",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 8,
                            }}
                          >
                            <span style={{ fontSize: "0.95rem", lineHeight: 1 }}>⚠️</span>
                            <div>
                              <strong style={{ color: "#f87171" }}>Rush Schedule Risk: </strong>
                              {task.riskWarning}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
