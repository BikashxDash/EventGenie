import React from "react";

const vibes = [
  "Royal & Grand",
  "Rustic & Bohemian",
  "Minimalist & Modern",
  "Retro / Vintage",
  "Tropical & Garden",
  "Glam & Luxe",
  "Traditional & Cultural",
  "Whimsical & Fairy-tale",
  "Industrial Chic",
  "Festival / Carnival",
];

const culturalOptions = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Jain",
  "Buddhist",
  "No specific preference",
];

const dietaryOptions = [
  "Pure Vegetarian",
  "Vegan-friendly",
  "Non-vegetarian",
  "Jain food",
  "Halal",
  "No specific requirement",
];

const eventTypes = [
  { value: "wedding", label: "💍 Wedding", icon: "💍" },
  { value: "birthday", label: "🎂 Birthday", icon: "🎂" },
  { value: "community", label: "🤝 Community Event / Fundraiser", icon: "🤝" },
];

function FieldError({ message }) {
  if (!message) return null;
  return <p className="form-error">⚠ {message}</p>;
}

export default function IntakeForm({ onSubmit, isLoading, onLoadSample }) {
  const [form, setForm] = React.useState({
    eventType: "",
    eventDate: "",
    city: "",
    guestCount: "",
    totalBudget: "",
    vibe: "",
    culturalPrefs: "",
    dietaryPrefs: "",
    extraNotes: "",
  });

  const [errors, setErrors] = React.useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.eventType) errs.eventType = "Please select an event type.";
    if (!form.eventDate) {
      errs.eventDate = "Please pick a date.";
    } else if (new Date(form.eventDate) < new Date()) {
      errs.eventDate = "Event date must be in the future.";
    }
    if (!form.city.trim()) errs.city = "City is required.";
    if (!form.guestCount || Number(form.guestCount) < 1)
      errs.guestCount = "Enter a valid guest count (≥ 1).";
    if (!form.totalBudget || Number(form.totalBudget) < 10000)
      errs.totalBudget = "Budget must be at least ₹10,000.";
    if (!form.vibe) errs.vibe = "Please choose a vibe / theme.";
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      ...form,
      guestCount: Number(form.guestCount),
      totalBudget: Number(form.totalBudget),
    });
  }

  // Today's date in YYYY-MM-DD for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card p-8 md:p-12 fade-in-up"
      style={{ maxWidth: 760, margin: "0 auto" }}
    >
      {/* ── Offline Demo Bar ── */}
      <div
        style={{
          background: "rgba(124, 92, 252, 0.08)",
          border: "1px solid rgba(124, 92, 252, 0.25)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
            <span>⚡</span>
            <span>Instant Demo Mode (No API Call)</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Explore pre-generated blueprints immediately even offline:
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            id="quick-demo-wedding"
            onClick={() => onLoadSample && onLoadSample("wedding")}
            className="chip"
            style={{ cursor: "pointer", border: "1px solid rgba(124, 92, 252, 0.35)", background: "rgba(124, 92, 252, 0.15)" }}
          >
            💍 Jaipur Wedding (₹25L)
          </button>
          <button
            type="button"
            id="quick-demo-birthday"
            onClick={() => onLoadSample && onLoadSample("birthday")}
            className="chip"
            style={{ cursor: "pointer", border: "1px solid rgba(236, 72, 153, 0.35)", background: "rgba(236, 72, 153, 0.15)" }}
          >
            🎂 21st Birthday (₹3.5L)
          </button>
          <button
            type="button"
            id="quick-demo-community"
            onClick={() => onLoadSample && onLoadSample("community")}
            className="chip"
            style={{ cursor: "pointer", border: "1px solid rgba(16, 185, 129, 0.35)", background: "rgba(16, 185, 129, 0.15)" }}
          >
            🌍 Charity Gala (₹12L)
          </button>
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "3rem",
            marginBottom: 12,
            filter: "drop-shadow(0 0 20px rgba(124,92,252,0.6))",
          }}
        >
          ✨
        </span>
        <h2
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: "1.8rem",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Tell us about your <span className="gradient-text">event</span>
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
          Fill in the details below and our AI will craft your perfect plan.
        </p>
      </div>

      {/* ── Event Type Cards ── */}
      <div style={{ marginBottom: 32 }}>
        <label className="form-label">Event Type *</label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginTop: 8,
          }}
        >
          {eventTypes.map((et) => (
            <button
              key={et.value}
              type="button"
              onClick={() => {
                setForm((prev) => ({ ...prev, eventType: et.value }));
                if (errors.eventType) setErrors((prev) => ({ ...prev, eventType: "" }));
              }}
              style={{
                padding: "16px 12px",
                borderRadius: 14,
                border: `2px solid ${
                  form.eventType === et.value
                    ? "var(--color-primary)"
                    : "var(--color-border)"
                }`,
                background:
                  form.eventType === et.value
                    ? "rgba(124,92,252,0.15)"
                    : "rgba(255,255,255,0.03)",
                color: "var(--color-text)",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.25s ease",
                textAlign: "center",
                boxShadow:
                  form.eventType === et.value
                    ? "0 0 20px rgba(124,92,252,0.25)"
                    : "none",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 6 }}>{et.icon}</div>
              <div>{et.label.replace(/^[^ ]+ /, "")}</div>
            </button>
          ))}
        </div>
        <FieldError message={errors.eventType} />
      </div>

      {/* ── Date & City ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div>
          <label className="form-label" htmlFor="eventDate">
            Event Date *
          </label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            min={today}
            value={form.eventDate}
            onChange={handleChange}
            className="form-input"
            style={{ colorScheme: "dark" }}
          />
          <FieldError message={errors.eventDate} />
        </div>
        <div>
          <label className="form-label" htmlFor="city">
            City *
          </label>
          <input
            id="city"
            name="city"
            type="text"
            placeholder="e.g. Mumbai, Jaipur, Bengaluru"
            value={form.city}
            onChange={handleChange}
            className="form-input"
          />
          <FieldError message={errors.city} />
        </div>
      </div>

      {/* ── Guest Count & Budget ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div>
          <label className="form-label" htmlFor="guestCount">
            Guest Count *
          </label>
          <input
            id="guestCount"
            name="guestCount"
            type="number"
            min="1"
            max="10000"
            placeholder="e.g. 250"
            value={form.guestCount}
            onChange={handleChange}
            className="form-input"
          />
          <FieldError message={errors.guestCount} />
        </div>
        <div>
          <label className="form-label" htmlFor="totalBudget">
            Total Budget (₹ INR) *
          </label>
          <input
            id="totalBudget"
            name="totalBudget"
            type="number"
            min="10000"
            placeholder="e.g. 1500000"
            value={form.totalBudget}
            onChange={handleChange}
            className="form-input"
          />
          {form.totalBudget && (
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "0.78rem",
                marginTop: 4,
              }}
            >
              ≈ ₹{Number(form.totalBudget).toLocaleString("en-IN")}
            </p>
          )}
          <FieldError message={errors.totalBudget} />
        </div>
      </div>

      {/* ── Vibe / Theme ── */}
      <div style={{ marginBottom: 20 }}>
        <label className="form-label" htmlFor="vibe">
          Vibe / Theme *
        </label>
        <select
          id="vibe"
          name="vibe"
          value={form.vibe}
          onChange={handleChange}
          className="form-input"
        >
          <option value="">— Choose a vibe —</option>
          {vibes.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <FieldError message={errors.vibe} />
      </div>

      {/* ── Cultural & Dietary ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <div>
          <label className="form-label" htmlFor="culturalPrefs">
            Cultural Preference
          </label>
          <select
            id="culturalPrefs"
            name="culturalPrefs"
            value={form.culturalPrefs}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">— Optional —</option>
            {culturalOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="dietaryPrefs">
            Dietary Preference
          </label>
          <select
            id="dietaryPrefs"
            name="dietaryPrefs"
            value={form.dietaryPrefs}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">— Optional —</option>
            {dietaryOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Extra Notes ── */}
      <div style={{ marginBottom: 36 }}>
        <label className="form-label" htmlFor="extraNotes">
          Extra Notes / Special Requests
        </label>
        <textarea
          id="extraNotes"
          name="extraNotes"
          rows={3}
          placeholder="e.g. outdoor venue preferred, live classical music, no alcohol…"
          value={form.extraNotes}
          onChange={handleChange}
          className="form-input"
          style={{ resize: "vertical" }}
        />
      </div>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary"
        style={{ width: "100%", justifyContent: "center", fontSize: "1.1rem", padding: "16px" }}
        id="submit-intake-form"
      >
        {isLoading ? (
          <>
            <div className="spinner" style={{ width: 22, height: 22, borderWidth: 2 }} />
            <span>Crafting your plan with AI…</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Generate My Event Plan</span>
          </>
        )}
      </button>
    </form>
  );
}
