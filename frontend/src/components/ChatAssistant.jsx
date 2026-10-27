import React, { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api/client";

export default function ChatAssistant({
  currentPlan,
  intake,
  onApplyPlanUpdate,
  onUndo,
  canUndo,
  lastChangeSummary,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "initial",
      sender: "assistant",
      text: "Hello! I'm your EventGenie AI Co-Planner. I have full real-time access to your budget, timeline, vendors, and ideas. You can instruct me to adjust your budget, move dates, alter dietary preferences, or rebalance plans!",
      diffItems: null,
      changeSummary: null,
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const quickPrompts = [
    { label: "💸 Cut budget by 20%", text: "cut the budget by 20%" },
    { label: "🥗 Make it vegetarian", text: "make it vegetarian" },
    { label: "📅 Move 2 weeks earlier", text: "move the event 2 weeks earlier" },
  ];

  async function handleSend(textToSend) {
    const text = (textToSend || inputVal).trim();
    if (!text || isLoading) return;

    setInputVal("");
    setErrorBanner("");

    const userMsgId = `user-${Date.now()}`;
    const newMessages = [...messages, { id: userMsgId, sender: "user", text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const historyContext = newMessages.slice(-6).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const response = await sendChatMessage(text, currentPlan, intake, historyContext);

      // Apply the plan and intake update in the parent (Home.jsx)
      if (response.updatedPlan && response.updatedIntake && onApplyPlanUpdate) {
        onApplyPlanUpdate({
          updatedPlan: response.updatedPlan,
          updatedIntake: response.updatedIntake,
          changeSummary: response.changeSummary,
          actionType: response.actionType,
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          sender: "assistant",
          text: response.chatReply,
          changeSummary: response.changeSummary,
          diffItems: response.diffItems && response.diffItems.length > 0 ? response.diffItems : null,
          actionType: response.actionType,
        },
      ]);
    } catch (err) {
      console.error("Chat co-planner error:", err);
      const errMsg =
        err.response?.data?.error ||
        "Could not process update. Please verify your connection or try again.";
      setErrorBanner(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: "assistant",
          text: `⚠️ ${errMsg}`,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Floating Launcher / Trigger Button */}
      {!isOpen && (
        <button
          id="chat-assistant-launcher"
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 28,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 22px",
            background: "linear-gradient(135deg, var(--color-primary), #9f7aea)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 999,
            fontFamily: "Outfit, sans-serif",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(124, 92, 252, 0.45)",
            transition: "all 0.25s ease",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>✨</span>
          <span>EventGenie Co-Planner</span>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#34d399",
              boxShadow: "0 0 8px #34d399",
            }}
          />
        </button>
      )}

      {/* Floating Docked Chat Panel */}
      {isOpen && (
        <div
          id="chat-assistant-panel"
          style={{
            position: "fixed",
            bottom: 24,
            right: 28,
            width: 440,
            maxWidth: "calc(100vw - 40px)",
            height: 600,
            maxHeight: "calc(100vh - 80px)",
            zIndex: 9999,
            background: "rgba(18, 14, 34, 0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(124, 92, 252, 0.35)",
            borderRadius: 20,
            boxShadow: "0 16px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(124, 92, 252, 0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "fadeInUp 0.25s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(255, 255, 255, 0.03)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, var(--color-primary), #9f7aea)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                }}
              >
                ✨
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#fff",
                  }}
                >
                  EventGenie Co-Planner
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "#34d399",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#34d399",
                    }}
                  />
                  Full Plan Synchronized
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {canUndo && (
                <button
                  id="chat-undo-btn-header"
                  onClick={onUndo}
                  title="Undo last plan modification"
                  style={{
                    padding: "4px 10px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: 6,
                    color: "#f87171",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  ↩ Undo
                </button>
              )}
              <button
                id="chat-assistant-close"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "none",
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(255, 255, 255, 0.02)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
              display: "flex",
              gap: 6,
              overflowX: "auto",
            }}
          >
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                id={`quick-prompt-${idx}`}
                onClick={() => handleSend(qp.text)}
                disabled={isLoading}
                style={{
                  flex: "0 0 auto",
                  padding: "5px 10px",
                  borderRadius: 14,
                  border: "1px solid rgba(124, 92, 252, 0.25)",
                  background: "rgba(124, 92, 252, 0.1)",
                  color: "var(--color-primary-light)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: isLoading ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === "user";

              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isUser ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "88%",
                      padding: "12px 16px",
                      borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                      background: isUser
                        ? "linear-gradient(135deg, var(--color-primary), #9f7aea)"
                        : "rgba(255, 255, 255, 0.05)",
                      color: "#fff",
                      fontSize: "0.88rem",
                      lineHeight: 1.5,
                      border: isUser ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
                      boxShadow: isUser ? "0 4px 15px rgba(124, 92, 252, 0.25)" : "none",
                    }}
                  >
                    {m.text}
                  </div>

                  {/* Before / After Change Summary Card */}
                  {m.changeSummary && (
                    <div
                      style={{
                        marginTop: 8,
                        maxWidth: "94%",
                        background: "rgba(16, 185, 129, 0.07)",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        borderRadius: 12,
                        padding: "12px 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "#34d399",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span>⚡</span> Plan Updated: {m.actionType || "MODIFIED"}
                        </div>
                        {canUndo && (
                          <button
                            id="diff-card-undo-btn"
                            onClick={onUndo}
                            style={{
                              background: "rgba(239, 68, 68, 0.2)",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              borderRadius: 4,
                              color: "#f87171",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "2px 8px",
                              cursor: "pointer",
                            }}
                          >
                            ↩ Undo Change
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--color-text)",
                          marginBottom: 8,
                          lineHeight: 1.4,
                        }}
                      >
                        {m.changeSummary}
                      </div>

                      {/* Diff Items Table */}
                      {m.diffItems && m.diffItems.length > 0 && (
                        <div
                          style={{
                            background: "rgba(0,0,0,0.25)",
                            borderRadius: 8,
                            padding: "8px 10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {m.diffItems.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.75rem",
                                borderBottom:
                                  idx < m.diffItems.length - 1
                                    ? "1px solid rgba(255,255,255,0.05)"
                                    : "none",
                                paddingBottom: idx < m.diffItems.length - 1 ? 4 : 0,
                              }}
                            >
                              <span style={{ color: "var(--color-text-muted)" }}>{item.field}:</span>
                              <span style={{ textAlign: "right" }}>
                                <s style={{ color: "#f87171", marginRight: 6 }}>{item.before}</s>
                                <span style={{ color: "#34d399", fontWeight: 700 }}>{item.after}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(124, 92, 252, 0.3)",
                    borderTopColor: "var(--color-primary-light)",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  Analyzing plan &amp; executing changes...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255, 255, 255, 0.03)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              style={{ display: "flex", gap: 8 }}
            >
              <input
                id="chat-assistant-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="e.g. cut budget by 20%, make it vegetarian..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "#fff",
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
              <button
                id="chat-assistant-send-btn"
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    inputVal.trim() && !isLoading
                      ? "linear-gradient(135deg, var(--color-primary), #9f7aea)"
                      : "rgba(255, 255, 255, 0.1)",
                  color: inputVal.trim() && !isLoading ? "#fff" : "rgba(255, 255, 255, 0.3)",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: inputVal.trim() && !isLoading ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
