import React, { useState } from "react";
import IntakeForm from "../components/IntakeForm";
import LoadingState from "../components/LoadingState";
import BudgetPlanner from "../components/BudgetPlanner";
import TimelineGenerator from "../components/TimelineGenerator";
import VendorChecklist from "../components/VendorChecklist";
import PersonalizedIdeas from "../components/PersonalizedIdeas";
import ChatAssistant from "../components/ChatAssistant";
import Toast from "../components/Toast";
import { generatePlan } from "../api/client";
import { SAMPLE_PLANS } from "../data/samplePlans";
import { exportEventPlanToPdf } from "../utils/exportPdf";

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
        gap: 6,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        padding: 6,
        marginBottom: 28,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: "1 0 auto",
              minWidth: 100,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: isActive
                ? "linear-gradient(135deg, var(--color-primary), #9f7aea)"
                : "transparent",
              color: isActive ? "#fff" : "var(--color-text-muted)",
              fontFamily: "Outfit,sans-serif",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              boxShadow: isActive
                ? "0 4px 16px rgba(124,92,252,0.35)"
                : "none",
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
function EventSummary({ plan, intake, onExportPdf, isExporting }) {
  const { eventSummary } = plan;
  return (
    <div className="glass-card fade-in-up" style={{ padding: "24px 28px", marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ flex: "1 1 300px" }}>
          <h2
            style={{
              fontFamily: "Outfit,sans-serif",
              fontSize: "clamp(1.25rem, 3vw, 1.6rem)",
              fontWeight: 800,
              marginBottom: 6,
            }}
            className="gradient-text"
          >
            {eventSummary.title}
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.92rem", fontStyle: "italic", margin: 0 }}>
            "{eventSummary.tagline}"
          </p>
        </div>

        {/* Download PDF button */}
        <button
          id="export-pdf-summary-btn"
          onClick={onExportPdf}
          disabled={isExporting}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10,
            fontFamily: "Outfit,sans-serif",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: isExporting ? "wait" : "pointer",
            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          <span>{isExporting ? "⏳" : "📄"}</span>
          <span>{isExporting ? "Generating PDF..." : "Download Blueprint (PDF)"}</span>
        </button>
      </div>

      {/* Highlights */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {eventSummary.highlights?.map((h, i) => (
          <span key={i} className="chip" style={{ fontSize: "0.78rem" }}>
            ✦ {h}
          </span>
        ))}
      </div>

      {/* Meta grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))",
          gap: 10,
        }}
      >
        {[
          { label: "Event Type", value: EVENT_LABELS[intake.eventType] || intake.eventType },
          { label: "Date", value: new Date(intake.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
          { label: "City", value: intake.city },
          { label: "Guests", value: `${Number(intake.guestCount).toLocaleString("en-IN")}` },
          { label: "Budget", value: `₹${Number(intake.totalBudget).toLocaleString("en-IN")}` },
          { label: "Dietary", value: intake.dietaryPrefs || "Standard" },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "10px 12px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
            }}
          >
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
              {label}
            </div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [state, setState] = useState("idle");
  const [plan, setPlan] = useState(null);
  const [intake, setIntake] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("budget");
  const [budgetCats, setBudgetCats] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toast, setToast] = useState(null);

  // History stack for undo functionality across plan & intake modifications
  const [historyStack, setHistoryStack] = useState([]);

  function showToast(message, type = "info") {
    setToast({ message, type });
  }

  // Pre-loaded sample plan loader (Zero API call demo mode)
  function handleLoadSample(sampleKey) {
    if (!sampleKey || !SAMPLE_PLANS[sampleKey]) return;
    const sample = SAMPLE_PLANS[sampleKey];

    // Deep clone to prevent mutations
    const loadedIntake = JSON.parse(JSON.stringify(sample.intake));
    const loadedPlan = JSON.parse(JSON.stringify(sample.plan));

    setIntake(loadedIntake);
    setPlan(loadedPlan);
    setBudgetCats(loadedPlan.budgetAllocation?.categories || []);
    setActiveTab("budget");
    setHistoryStack([]);
    setState("result");

    showToast(`⚡ Demo Mode: Loaded "${loadedPlan.eventSummary.title}" without API calls!`, "success");
  }

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
      showToast("Event blueprint generated with Google Gemini!", "success");
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Something went wrong. Please try again.";
      setErrorMsg(msg);
      setState("error");
      showToast(msg, "error");
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
    showToast(`Plan updated: ${changeSummary}`, "success");
  }

  // Handle undo action
  function handleUndo() {
    if (historyStack.length === 0) return;
    const lastSnapshot = historyStack[historyStack.length - 1];
    setPlan(lastSnapshot.plan);
    setIntake(lastSnapshot.intake);
    setBudgetCats(lastSnapshot.budgetCats);
    setHistoryStack((prev) => prev.slice(0, -1));
    showToast("Reverted to previous plan state", "info");
  }

  // PDF Export trigger
  async function handleExportPdf() {
    if (!plan || !intake) return;
    setIsExportingPdf(true);
    try {
      // Collect vendor statuses from localStorage if present
      let vendorStatuses = {};
      try {
        const vKey = `eventgenie_vendors_${intake.eventType}`;
        const saved = localStorage.getItem(vKey);
        if (saved) vendorStatuses = JSON.parse(saved);
      } catch (e) {
        console.warn("Could not read local vendor statuses:", e);
      }

      // Collect favorites
      let savedFavorites = {};
      try {
        const fKey = `eventgenie_favs_${intake.eventType}`;
        const saved = localStorage.getItem(fKey);
        if (saved) savedFavorites = JSON.parse(saved);
      } catch (e) {
        console.warn("Could not read local favorites:", e);
      }

      const res = await exportEventPlanToPdf({
        plan,
        intake,
        vendorStatuses,
        savedFavorites,
      });

      showToast(`Blueprint PDF downloaded: ${res.fileName}`, "success");
    } catch (err) {
      console.error("PDF export error:", err);
      showToast("Failed to generate PDF. Please try again.", "error");
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", zIndex: 1 }}>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Persistent Top Navbar ── */}
      <nav
        style={{
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(18, 14, 34, 0.75)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleReset}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 0,
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>✨</span>
            <span
              style={{
                fontFamily: "Outfit, sans-serif",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.02em",
              }}
            >
              EventGenie
            </span>
          </button>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(124, 92, 252, 0.15)",
              color: "var(--color-primary-light)",
              border: "1px solid rgba(124, 92, 252, 0.3)",
            }}
          >
            v2.0 • Phase 6
          </span>
        </div>

        {/* Actions & Demo Mode Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Sample loader selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "none" }}>
              Demo:
            </span>
            <select
              id="load-sample-plan-select"
              defaultValue=""
              onChange={(e) => {
                handleLoadSample(e.target.value);
                e.target.value = "";
              }}
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: "1px solid rgba(124, 92, 252, 0.35)",
                background: "rgba(124, 92, 252, 0.12)",
                color: "#fff",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="" disabled style={{ background: "#1a162b", color: "#999" }}>
                ⚡ Load Sample Plan (Offline Demo)...
              </option>
              <option value="wedding" style={{ background: "#1a162b", color: "#fff" }}>
                💍 Royal Jaipur Wedding (₹25L)
              </option>
              <option value="birthday" style={{ background: "#1a162b", color: "#fff" }}>
                🎂 Cyberpunk 21st Birthday (₹3.5L)
              </option>
              <option value="community" style={{ background: "#1a162b", color: "#fff" }}>
                🌍 Green Future Charity Gala (₹12L)
              </option>
            </select>
          </div>

          {state === "result" && (
            <>
              <button
                id="navbar-download-pdf-btn"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: isExportingPdf ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <span>{isExportingPdf ? "⏳" : "📄"}</span>
                <span>PDF</span>
              </button>
              <button
                id="navbar-new-plan-btn"
                onClick={handleReset}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "var(--color-text-muted)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                New
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Page header ── */}
      <header style={{ padding: "32px 20px 0", textAlign: "center", marginBottom: 32 }}>
        <div style={{ marginBottom: 12 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 14px",
              background: "rgba(124,92,252,0.15)",
              border: "1px solid rgba(124,92,252,0.3)",
              borderRadius: 999,
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "var(--color-primary-light)",
            }}
          >
            <div className="pulse-dot" />
            GenAI Event Engine + Offline Sample Mode
          </span>
        </div>
        <h1
          className="shine-text"
          style={{
            fontFamily: "Outfit,sans-serif",
            fontSize: "clamp(2rem, 5.5vw, 3.6rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 12,
          }}
        >
          EventGenie ✨
        </h1>
        <p
          style={{
            color: "var(--color-text-muted)",
            fontSize: "0.98rem",
            maxWidth: 580,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Plan weddings, birthdays &amp; fundraisers with AI-curated budgets,
          countdown timelines, vendor screening checklists, and interactive co-planner.
        </p>
      </header>

      {/* ── Main ── */}
      <main style={{ padding: "0 16px 80px", maxWidth: 1100, margin: "0 auto" }}>
        {state === "idle" && (
          <IntakeForm
            onSubmit={handleSubmit}
            isLoading={false}
            onLoadSample={handleLoadSample}
          />
        )}

        {state === "loading" && <LoadingState />}

        {state === "error" && (
          <div
            className="glass-card fade-in-up"
            style={{
              maxWidth: 540,
              margin: "40px auto",
              padding: "40px 32px",
              textAlign: "center",
              borderColor: "rgba(239,68,68,0.3)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>😞</div>
            <h3 style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1.25rem", marginBottom: 10, color: "var(--color-error)" }}>
              Oops! Something went wrong.
            </h3>
            <p style={{ color: "var(--color-text-muted)", marginBottom: 28, lineHeight: 1.6, fontSize: "0.9rem" }}>
              {errorMsg}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={handleReset} className="btn-primary" id="error-try-again-btn">
                ↩ Try Again
              </button>
              <button
                onClick={() => handleLoadSample("wedding")}
                className="btn-secondary"
                id="error-load-demo-btn"
              >
                ⚡ Load Sample Wedding Plan
              </button>
            </div>
          </div>
        )}

        {state === "result" && plan && (
          <div className="fade-in-up">
            {/* Event summary always visible */}
            <EventSummary
              plan={plan}
              intake={intake}
              onExportPdf={handleExportPdf}
              isExporting={isExportingPdf}
            />

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
            <div
              style={{
                textAlign: "center",
                marginTop: 48,
                display: "flex",
                justifyContent: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <button
                id="footer-export-pdf-btn"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="btn-primary"
                style={{
                  background: "linear-gradient(135deg, #10b981, #059669)",
                }}
              >
                <span>{isExportingPdf ? "⏳" : "📄"}</span>
                <span>{isExportingPdf ? "Generating PDF..." : "Download Full PDF Blueprint"}</span>
              </button>
              <button
                onClick={handleReset}
                className="btn-secondary"
                id="plan-another-event-btn"
              >
                ← Plan Another Event
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
