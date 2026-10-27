import React from "react";
import IntakeForm from "../components/IntakeForm";
import LoadingState from "../components/LoadingState";
import BudgetPlanner from "../components/BudgetPlanner";
import TimelineGenerator from "../components/TimelineGenerator";
import VendorChecklist from "../components/VendorChecklist";
import PersonalizedIdeas from "../components/PersonalizedIdeas";
import ChatAssistant from "../components/ChatAssistant";
import { generatePlan } from "../api/client";

const EVENT_LABELS = {
  wedding: "💍 Wedding",
  birthday: "🎂 Birthday",
  community: "🤝 Community Event",
};

// ─── Tab navigation ─────────────────────────────────────────────────────────
const TABS = [
  { id: "budget", label: "💰 Budget", phase: 2 },
  { id: "timeline", label: "⏳ Timeline", phase: 3 },
  { id: "vendors", label: "📋 Vendors", phase: 4 },
  { id: "ideas", label: "💡 Ideas", phase: 5 },
];

function TabBar({ active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        padding: 4,
        marginBottom: 32,
        overflowX: "auto",
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const isLocked = tab.phase > 5; // Phase 5 unlocked
        return (
          <button
            key={tab.id}
            onClick={() => !isLocked && onChange(tab.id)}
            disabled={isLocked}
            style={{
              flex: "0 0 auto",
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: isActive
                ? "linear-gradient(135deg, var(--color-primary), #9f7aea)"
                : "transparent",
              color: isLocked
                ? "rgba(255,255,255,0.2)"
                : isActive
                ? "#fff"
                : "var(--color-text-muted)",
              fontFamily: "Outfit,sans-serif",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: isLocked ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              boxShadow: isActive
                ? "0 4px 16px rgba(124,92,252,0.35)"
                : "none",
              position: "relative",
            }}
            id={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Event summary cards ────────────────────────────────────────────────────
function EventSummary({ plan, intake }) {
  const { eventSummary } = plan;
  return (
    <div className="glass-card fade-in-up" style={{ padding: "28px 32px", marginBottom: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontFamily: "Outfit,sans-serif",
            fontSize: "1.5rem",
            fontWeight: 800,
            marginBottom: 6,
          }}
          className="gradient-text"
        >
          {eventSummary.title}
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", fontStyle: "italic" }}>
          "{eventSummary.tagline}"
        </p>
      </div>

      {/* Highlights */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {eventSummary.highlights?.map((h, i) => (
          <span key={i} className="chip">
            ✦ {h}
          </span>
        ))}
      </div>

      {/* Meta grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 12 }}>
        {[
          { label: "Event Type", value: EVENT_LABELS[intake.eventType] || intake.eventType },
          { label: "Date", value: new Date(intake.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
          { label: "City", value: intake.city },
          { label: "Guests", value: intake.guestCount.toLocaleString("en-IN") },
          { label: "Budget", value: `₹${intake.totalBudget.toLocaleString("en-IN")}` },
          { label: "Vibe", value: intake.vibe },
          { label: "Dietary", value: intake.dietaryPrefs || "Standard" },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "12px 14px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 10,
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [state, setState] = React.useState("idle");
  const [plan, setPlan] = React.useState(null);
  const [intake, setIntake] = React.useState(null);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("budget");
  const [budgetCats, setBudgetCats] = React.useState(null);

  // History stack for undo functionality across plan & intake modifications
  const [historyStack, setHistoryStack] = React.useState([]);

  async function handleSubmit(formData) {
    setState("loading");
    setErrorMsg("");
    try {
      const result = await generatePlan(formData);
      setPlan(result.plan);
      setBudgetCats(result.plan.budgetAllocation?.categories || []);
      setIntake(formData);
      setActiveTab("budget");
      setHistoryStack([]);
      setState("result");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Something went wrong. Please try again.";
      setErrorMsg(msg);
      setState("error");
    }
  }

  function handleReset() {
    setState("idle");
    setPlan(null);
    setIntake(null);
    setErrorMsg("");
    setBudgetCats(null);
    setHistoryStack([]);
  }

  function handleBudgetUpdate(updatedCats) {
    setBudgetCats(updatedCats);
    setPlan((prev) => ({
      ...prev,
      budgetAllocation: {
        ...prev.budgetAllocation,
        categories: updatedCats,
      },
    }));
  }

  // Handle plan updates applied by the Chat Co-Planner
  function handleApplyPlanUpdate({ updatedPlan, updatedIntake, changeSummary, actionType }) {
    // Snapshot current state into undo history
    setHistoryStack((prev) => [
      ...prev,
      {
        plan: JSON.parse(JSON.stringify(plan)),
        intake: JSON.parse(JSON.stringify(intake)),
        budgetCats: JSON.parse(JSON.stringify(budgetCats || [])),
        changeSummary,
        actionType,
      },
    ]);

    setPlan(updatedPlan);
    setIntake(updatedIntake);
    if (updatedPlan.budgetAllocation?.categories) {
      setBudgetCats(updatedPlan.budgetAllocation.categories);
    }
  }

  // Handle undo action
  function handleUndo() {
    if (historyStack.length === 0) return;
    const lastSnapshot = historyStack[historyStack.length - 1];
    setPlan(lastSnapshot.plan);
    setIntake(lastSnapshot.intake);
    setBudgetCats(lastSnapshot.budgetCats);
    setHistoryStack((prev) => prev.slice(0, -1));
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", zIndex: 1 }}>
      {/* ── Page header ── */}
      <header style={{ padding: "32px 24px 0", textAlign: "center", marginBottom: 40 }}>
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              background: "rgba(124,92,252,0.15)",
              border: "1px solid rgba(124,92,252,0.3)",
              borderRadius: 999,
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--color-primary-light)",
            }}
          >
            <div className="pulse-dot" />
            Powered by Google Gemini
          </span>
        </div>
        <h1
          className="shine-text"
          style={{
            fontFamily: "Outfit,sans-serif",
            fontSize: "clamp(2.4rem,6vw,4rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 14,
          }}
        >
          EventGenie ✨
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "1.05rem",
            maxWidth: 560,
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          Your GenAI-powered event planning assistant for weddings, birthdays &amp;
          community celebrations — tailored to your budget, city, and culture.
        </p>
      </header>

      {/* ── Main ── */}
      <main style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
        {state === "idle" && (
          <IntakeForm onSubmit={handleSubmit} isLoading={false} />
        )}

        {state === "loading" && <LoadingState />}

        {state === "error" && (
          <div
            className="glass-card fade-in-up"
            style={{
              maxWidth: 540, margin: "60px auto", padding: "48px 40px",
              textAlign: "center", borderColor: "rgba(239,68,68,0.3)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>😞</div>
            <h3 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1.3rem", marginBottom: 12, color: "var(--color-error)" }}>
              Oops! Something went wrong.
            </h3>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 32, lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <button onClick={handleReset} className="btn-primary" id="error-try-again-btn">
              ↩ Try Again
            </button>
          </div>
        )}

        {state === "result" && plan && (
          <div className="fade-in-up">
            {/* Event summary always visible */}
            <EventSummary plan={plan} intake={intake} />

            {/* Tab bar */}
            <TabBar active={activeTab} onChange={setActiveTab} />

            {/* Tab content */}
            {activeTab === "budget" && budgetCats && (
              <BudgetPlanner
                categories={budgetCats}
                totalBudget={intake.totalBudget}
                onUpdate={handleBudgetUpdate}
              />
            )}
            {activeTab === "timeline" && plan?.timeline && (
              <TimelineGenerator
                timeline={plan.timeline}
                intake={intake}
              />
            )}
            {activeTab === "vendors" && plan?.vendorChecklist && (
              <VendorChecklist
                vendorChecklist={plan.vendorChecklist}
                budgetCategories={budgetCats || plan.budgetAllocation?.categories || []}
                intake={intake}
              />
            )}
            {activeTab === "ideas" && plan?.personalizedIdeas && (
              <PersonalizedIdeas
                ideas={plan.personalizedIdeas}
                intake={intake}
                onUpdateSection={(sectionKey, newIdeas) => {
                  setPlan((prev) => ({
                    ...prev,
                    personalizedIdeas: {
                      ...prev.personalizedIdeas,
                      [sectionKey]: newIdeas,
                    },
                  }));
                }}
              />
            )}

            {/* AI Co-Planner Floating Assistant (synchronised with plan) */}
            <ChatAssistant
              currentPlan={plan}
              intake={intake}
              onApplyPlanUpdate={handleApplyPlanUpdate}
              onUndo={handleUndo}
              canUndo={historyStack.length > 0}
            />

            {/* Footer actions */}
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <button onClick={handleReset} className="btn-secondary" id="plan-another-event-btn">
                ← Plan Another Event
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
