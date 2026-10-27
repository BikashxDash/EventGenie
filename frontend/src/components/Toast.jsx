import React, { useEffect } from "react";

export default function Toast({ message, type = "info", onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgMap = {
    success: "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))",
    error: "linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))",
    warning: "linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))",
    info: "linear-gradient(135deg, rgba(124, 92, 252, 0.95), rgba(109, 40, 217, 0.95))",
  };

  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "⚠️",
    info: "✨",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 99999,
        background: bgMap[type] || bgMap.info,
        color: "#fff",
        padding: "12px 20px",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(124, 92, 252, 0.3)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "Outfit, sans-serif",
        fontSize: "0.9rem",
        fontWeight: 600,
        maxWidth: "calc(100vw - 48px)",
        animation: "fadeInUp 0.25s ease",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.75rem",
          fontWeight: 800,
        }}
      >
        {iconMap[type] || "•"}
      </span>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255, 255, 255, 0.7)",
          cursor: "pointer",
          fontSize: "1rem",
          marginLeft: 8,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
