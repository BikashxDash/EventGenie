import React, { useState, useEffect } from "react";
import { regenerateIdeasSection } from "../api/client";

const SECTION_CONFIG = {
  themes: {
    title: "Thematic Concepts",
    icon: "🎨",
    description: "Tailored themes balancing vibe, heritage, and guest profile",
    accent: "#a78bfa",
  },
  decorIdeas: {
    title: "Decor & Ambience",
    icon: "🏮",
    description: "Color palettes, floral installations, stage setups & lighting",
    accent: "#ec4899",
  },
  menuIdeas: {
    title: "Catering & Menu",
    icon: "🍽️",
    description: "Curated course stations honoring your dietary preferences",
    accent: "#10b981",
  },
  activityIdeas: {
    title: "Guest Activities & Entertainment",
    icon: "🎭",
    description: "Engaging rituals, crowd interactive games & live acts",
    accent: "#f59e0b",
  },
};

export default function PersonalizedIdeas({ ideas, intake, onUpdateSection }) {
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "favorites" | sectionKey
  const [loadingSection, setLoadingSection] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Favorites stored in localStorage
  const storageKey = `eventgenie_favs_${intake?.eventType || "general"}`;
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favorites));
    } catch (e) {
      console.warn("Failed to persist favorites:", e);
    }
  }, [favorites, storageKey]);

  function toggleFavorite(sectionKey, idea) {
    setFavorites((prev) => {
      const next = { ...prev };
      const itemKey = `${sectionKey}_${idea.title}`;
      if (next[itemKey]) {
        delete next[itemKey];
      } else {
        next[itemKey] = { ...idea, sectionKey };
      }
      return next;
    });
  }

  const favoriteCount = Object.keys(favorites).length;

  async function handleRegenerate(sectionKey) {
    if (loadingSection) return;
    setLoadingSection(sectionKey);
    setErrorMessage("");

    try {
      const result = await regenerateIdeasSection(sectionKey, intake, ideas);
      if (result.ideas && onUpdateSection) {
        onUpdateSection(sectionKey, result.ideas);
      }
    } catch (err) {
      console.error("Regeneration failed:", err);
      setErrorMessage(
        err.response?.data?.error || "Failed to regenerate ideas. Please try again."
      );
    } finally {
      setLoadingSection(null);
    }
  }

  const sectionsToShow =
    activeFilter === "favorites"
      ? []
      : activeFilter === "all"
      ? Object.keys(SECTION_CONFIG)
      : [activeFilter];

  return (
    <div className="fade-in-up" style={{ marginBottom: 40 }}>
      {/* Header bar */}
      <div
        className="glass-card"
        style={{
          padding: "24px 28px",
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <h2
              className="gradient-text"
              style={{
                fontFamily: "Outfit,sans-serif",
                fontSize: "1.45rem",
                fontWeight: 800,
                margin: 0,
              }}
            >
              Personalised Event Ideas ✨
            </h2>
            {intake?.dietaryPrefs && (
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                🥗 {intake.dietaryPrefs}
              </span>
            )}
          </div>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.88rem", margin: 0 }}>
            5 curated concepts per section tailored to {intake.city}, {intake.vibe} vibe, and your INR budget.
          </p>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveFilter("all")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: activeFilter === "all" ? "var(--color-primary)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            All Ideas
          </button>
          {Object.entries(SECTION_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: activeFilter === key ? "var(--color-primary)" : "rgba(255,255,255,0.05)",
                color: activeFilter === key ? "#fff" : "var(--color-text-muted)",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {cfg.icon} {cfg.title.split(" ")[0]}
            </button>
          ))}
          <button
            id="filter-favorites-btn"
            onClick={() => setActiveFilter("favorites")}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid rgba(245, 158, 11, 0.4)",
              background: activeFilter === "favorites" ? "#f59e0b" : "rgba(245, 158, 11, 0.1)",
              color: activeFilter === "favorites" ? "#000" : "#fbbf24",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ⭐ Saved ({favoriteCount})
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: "12px 18px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 10,
            color: "#f87171",
            fontSize: "0.88rem",
            marginBottom: 20,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Favorites View */}
      {activeFilter === "favorites" && (
        <div>
          {favoriteCount === 0 ? (
            <div
              className="glass-card"
              style={{ padding: "48px 32px", textAlign: "center", color: "var(--color-text-muted)" }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⭐</div>
              <h4 style={{ color: "#fff", marginBottom: 6 }}>No saved favorites yet</h4>
              <p style={{ fontSize: "0.88rem" }}>
                Click the star icon on any idea card across Theme, Decor, Menu, or Activities to save it here.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {Object.entries(favorites).map(([key, item]) => (
                <div
                  key={key}
                  className="glass-card"
                  style={{
                    padding: "20px 22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    borderLeft: `4px solid ${SECTION_CONFIG[item.sectionKey]?.accent || "#a78bfa"}`,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: SECTION_CONFIG[item.sectionKey]?.accent || "#a78bfa",
                        }}
                      >
                        {SECTION_CONFIG[item.sectionKey]?.icon} {SECTION_CONFIG[item.sectionKey]?.title}
                      </span>
                      <button
                        onClick={() => toggleFavorite(item.sectionKey, item)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2rem",
                          color: "#fbbf24",
                          padding: 0,
                        }}
                        title="Remove from favorites"
                      >
                        ★
                      </button>
                    </div>
                    <h4
                      style={{
                        fontFamily: "Outfit,sans-serif",
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        marginBottom: 8,
                        color: "#fff",
                      }}
                    >
                      {item.title}
                    </h4>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--color-text-muted)",
                        lineHeight: 1.55,
                        margin: 0,
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                  {item.tag && (
                    <div style={{ marginTop: 14 }}>
                      <span className="chip" style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                        {item.tag}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sections View */}
      {activeFilter !== "favorites" &&
        sectionsToShow.map((sectionKey) => {
          const cfg = SECTION_CONFIG[sectionKey];
          const sectionIdeas = ideas?.[sectionKey] || [];
          const isLoading = loadingSection === sectionKey;

          return (
            <div key={sectionKey} style={{ marginBottom: 36 }}>
              {/* Section Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 16,
                  paddingBottom: 8,
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "1.4rem" }}>{cfg.icon}</span>
                    <h3
                      style={{
                        fontFamily: "Outfit,sans-serif",
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        margin: 0,
                        color: "#fff",
                      }}
                    >
                      {cfg.title}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        background: "rgba(255,255,255,0.08)",
                        padding: "2px 8px",
                        borderRadius: 12,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      5 Ideas
                    </span>
                    {sectionKey === "menuIdeas" && intake?.dietaryPrefs && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          background: "rgba(16,185,129,0.15)",
                          color: "#34d399",
                          padding: "2px 8px",
                          borderRadius: 12,
                          border: "1px solid rgba(16,185,129,0.3)",
                        }}
                      >
                        ✓ {intake.dietaryPrefs} compliant
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--color-text-muted)",
                      margin: "4px 0 0 0",
                    }}
                  >
                    {cfg.description}
                  </p>
                </div>

                {/* Regenerate Button per section */}
                <button
                  id={`regen-${sectionKey}-btn`}
                  onClick={() => handleRegenerate(sectionKey)}
                  disabled={isLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    background: isLoading
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(124, 92, 252, 0.15)",
                    color: isLoading ? "var(--color-text-muted)" : "var(--color-primary-light)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: isLoading ? "wait" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      animation: isLoading ? "spin 1s linear infinite" : "none",
                    }}
                  >
                    🔄
                  </span>
                  {isLoading ? "Generating..." : "Regenerate"}
                </button>
              </div>

              {/* Ideas Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 16,
                }}
              >
                {sectionIdeas.map((idea, idx) => {
                  const favKey = `${sectionKey}_${idea.title}`;
                  const isFavorited = Boolean(favorites[favKey]);

                  return (
                    <div
                      key={idea.id || idx}
                      className="glass-card"
                      style={{
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all 0.2s ease",
                        border: isFavorited
                          ? "1px solid rgba(245, 158, 11, 0.45)"
                          : "1px solid var(--color-border)",
                        background: isFavorited
                          ? "rgba(245, 158, 11, 0.04)"
                          : "rgba(255, 255, 255, 0.02)",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 10,
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: cfg.accent,
                              background: "rgba(255,255,255,0.05)",
                              padding: "2px 8px",
                              borderRadius: 4,
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <button
                            id={`fav-btn-${sectionKey}-${idx}`}
                            onClick={() => toggleFavorite(sectionKey, idea)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "1.25rem",
                              lineHeight: 1,
                              color: isFavorited ? "#fbbf24" : "rgba(255,255,255,0.25)",
                              transition: "transform 0.15s, color 0.15s",
                              transform: isFavorited ? "scale(1.1)" : "scale(1)",
                              padding: "2px",
                            }}
                            title={isFavorited ? "Saved to favorites" : "Save to favorites"}
                          >
                            ★
                          </button>
                        </div>

                        <h4
                          style={{
                            fontFamily: "Outfit,sans-serif",
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: "#fff",
                            marginBottom: 8,
                            lineHeight: 1.35,
                          }}
                        >
                          {idea.title}
                        </h4>
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--color-text-muted)",
                            lineHeight: 1.5,
                            margin: 0,
                          }}
                        >
                          {idea.description}
                        </p>
                      </div>

                      <div
                        style={{
                          marginTop: 14,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {idea.tag && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              padding: "2px 8px",
                              borderRadius: 6,
                              background:
                                sectionKey === "menuIdeas"
                                  ? "rgba(16, 185, 129, 0.12)"
                                  : "rgba(124, 92, 252, 0.12)",
                              color:
                                sectionKey === "menuIdeas"
                                  ? "#34d399"
                                  : "var(--color-primary-light)",
                              border: `1px solid ${
                                sectionKey === "menuIdeas"
                                  ? "rgba(16, 185, 129, 0.25)"
                                  : "rgba(124, 92, 252, 0.25)"
                              }`,
                            }}
                          >
                            {idea.tag}
                          </span>
                        )}
                        {isFavorited && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              color: "#fbbf24",
                            }}
                          >
                            Saved ⭐
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
