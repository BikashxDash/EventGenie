import React from "react";

export default function LoadingState({ message = "Our AI is crafting your personalized event plan…" }) {
  const steps = [
    "Analysing your event details",
    "Building budget allocation",
    "Generating timeline",
    "Curating vendor checklist",
    "Crafting personalised ideas",
  ];
  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="glass-card fade-in-up"
      style={{
        maxWidth: 540,
        margin: "60px auto",
        padding: "60px 48px",
        textAlign: "center",
      }}
    >
      {/* Animated logo */}
      <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 32px" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            animation: "spin 2s linear infinite",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            background: "var(--color-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
          }}
        >
          ✨
        </div>
      </div>

      <h3
        style={{
          fontFamily: "Outfit, sans-serif",
          fontSize: "1.4rem",
          fontWeight: 700,
          marginBottom: 12,
        }}
        className="gradient-text"
      >
        Summoning EventGenie…
      </h3>
      <p style={{ color: "var(--color-text-muted)", marginBottom: 40, lineHeight: 1.6 }}>
        {message}
      </p>

      {/* Step progress */}
      <div style={{ textAlign: "left" }}>
        {steps.map((step, i) => (
          <div
            key={step}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              opacity: i > activeStep ? 0.3 : 1,
              transition: "opacity 0.4s ease",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: `2px solid ${
                  i < activeStep
                    ? "var(--color-success)"
                    : i === activeStep
                    ? "var(--color-primary)"
                    : "var(--color-border)"
                }`,
                background:
                  i < activeStep
                    ? "var(--color-success)"
                    : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.4s ease",
                fontSize: "0.7rem",
              }}
            >
              {i < activeStep ? "✓" : i === activeStep ? <div className="pulse-dot" /> : ""}
            </div>
            <span
              style={{
                fontSize: "0.9rem",
                color:
                  i <= activeStep ? "var(--color-text)" : "var(--color-text-muted)",
                fontWeight: i === activeStep ? 600 : 400,
              }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
