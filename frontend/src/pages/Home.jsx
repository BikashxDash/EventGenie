import React from "react";
import IntakeForm from "../components/IntakeForm";
import LoadingState from "../components/LoadingState";
import { generatePlan } from "../api/client";

const EVENT_LABELS = {
  wedding: "💍 Wedding",
  birthday: "🎂 Birthday",
  community: "🤝 Community Event",
};

function PlanPreview({ plan, intake }) {
  return (
    <div className="fade-in-up" style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Success banner */}
      <div
        className="glass-card"
        style={{
          padding: "28px 32px",
          marginBottom: 24,
          borderColor: "rgba(16,185,129,0.3)",
          background: "rgba(16,185,129,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="pulse-dot" />
          <span style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1.1rem" }}>
            ✅ EventGenie plan generated successfully!
          </span>
        </div>
        <p style={{ color: "var(--color-text-muted)", marginTop: 8, fontSize: "0.9rem" }}>
          Phase 1 test — raw AI JSON verified. Budget planner, timeline, and more coming in
          Phase 2+.
        </p>
      </div>

      {/* Meta */}
      <div className="glass-card" style={{ padding: "28px 32px", marginBottom: 20 }}>
        <h3
          style={{
            fontFamily: "Outfit,sans-serif",
            fontWeight: 700,
            fontSize: "1.2rem",
            marginBottom: 20,
          }}
        >
          📋 Event Summary
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {[
            { label: "Event Type", value: EVENT_LABELS[intake.eventType] || intake.eventType },
            { label: "Date", value: new Date(intake.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
            { label: "City", value: intake.city },
            { label: "Guests", value: intake.guestCount.toLocaleString("en-IN") },
            { label: "Budget", value: `₹${intake.totalBudget.toLocaleString("en-IN")}` },
            { label: "Vibe", value: intake.vibe },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                padding: "14px 16px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Raw JSON preview */}
      <div className="glass-card" style={{ padding: "28px 32px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h3
            style={{ fontFamily: "Outfit,sans-serif", fontWeight: 700, fontSize: "1.1rem" }}
          >
            🤖 AI Response (Structured JSON)
          </h3>
          <span className="chip">Phase 1 Debug View</span>
        </div>
        <pre
          style={{
            background: "rgba(0,0,0,0.4)",
            borderRadius: 12,
            padding: 20,
            fontSize: "0.78rem",
            color: "#a5f3fc",
            overflowX: "auto",
            lineHeight: 1.6,
            maxHeight: 500,
            overflowY: "auto",
          }}
        >
          {JSON.stringify(plan, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function Home() {
  const [state, setState] = React.useState("idle"); // idle | loading | result | error
  const [plan, setPlan] = React.useState(null);
  const [intake, setIntake] = React.useState(null);
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handleSubmit(formData) {
    setState("loading");
    setErrorMsg("");
    try {
      const result = await generatePlan(formData);
      setPlan(result.plan);
      setIntake(formData);
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
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", zIndex: 1 }}>
      {/* Page header */}
      <header
        style={{
          padding: "32px 24px 0",
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        <div style={{ marginBottom: 16 }}>
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
            fontFamily: "Outfit, sans-serif",
            fontSize: "clamp(2.4rem, 6vw, 4rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 16,
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

      {/* Main content */}
      <main style={{ padding: "0 24px 80px" }}>
        {state === "idle" && (
          <IntakeForm onSubmit={handleSubmit} isLoading={false} />
        )}

        {state === "loading" && <LoadingState />}

        {state === "error" && (
          <div
            className="glass-card fade-in-up"
            style={{
              maxWidth: 540,
              margin: "60px auto",
              padding: "48px 40px",
              textAlign: "center",
              borderColor: "rgba(239,68,68,0.3)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>😞</div>
            <h3
              style={{
                fontFamily: "Outfit,sans-serif",
                fontWeight: 700,
                fontSize: "1.3rem",
                marginBottom: 12,
                color: "var(--color-error)",
              }}
            >
              Oops! Something went wrong.
            </h3>
            <p
              style={{
                color: "var(--color-text-muted)",
                marginBottom: 32,
                lineHeight: 1.6,
              }}
            >
              {errorMsg}
            </p>
            <button
              onClick={handleReset}
              className="btn-primary"
              id="error-try-again-btn"
            >
              ↩ Try Again
            </button>
          </div>
        )}

        {state === "result" && plan && (
          <div>
            <PlanPreview plan={plan} intake={intake} />
            <div style={{ textAlign: "center", marginTop: 40 }}>
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
