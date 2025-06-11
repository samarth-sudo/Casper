import React, { useState, useEffect } from "react";

export default function App() {
  const [mode, setMode] = useState("translate");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1); // -1 = current

  // Fetch new response every 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8080/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });

        const data = await res.json();
        const newAnswer = data.answer;
        setAnswer(newAnswer);
        setHistory((prev) => [...prev, newAnswer]);
        setHistoryIndex(-1);
      } catch (err) {
        console.error("Casper backend error:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [mode]);

  // Handle keys: Ctrl+Shift+X to clear, Up/Down to browse history
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (e.ctrlKey && e.shiftKey && key === "x") {
        setAnswer("");
        setHistoryIndex(-1);
      }

      if (key === "arrowup" && history.length > 0) {
        e.preventDefault();
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        setAnswer(history[history.length - 1 - newIndex]);
      }

      if (key === "arrowdown" && history.length > 0) {
        e.preventDefault();
        const newIndex = Math.max(historyIndex - 1, -1);
        setHistoryIndex(newIndex);
        if (newIndex === -1) {
          setAnswer(history[history.length - 1]); // latest
        } else {
          setAnswer(history[history.length - 1 - newIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [history, historyIndex]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
        fontFamily: "sans-serif",
      }}
    >
      {/* Dropdown Mode Selector */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          pointerEvents: "auto",
          backgroundColor: "#111111cc",
          borderRadius: "8px",
          padding: "10px",
          color: "white",
          width: "200px",
        }}
      >
        <label htmlFor="mode" style={{ display: "block", marginBottom: "6px" }}>
          🧠 Casper Mode
        </label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{
            width: "100%",
            padding: "6px",
            borderRadius: "4px",
            background: "#222",
            color: "white",
            border: "1px solid #444",
          }}
        >
          <option value="translate">🌐 Translate</option>
          <option value="code">💻 Code Help</option>
        </select>
      </div>

      {/* Output Box */}
      {answer && (
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 30,
            width: "400px",
            backgroundColor: "#000000cc",
            color: "white",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "0.9rem",
            lineHeight: "1.4",
            pointerEvents: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>🧠 Casper Response</strong>
            <button
              onClick={() => {
                setAnswer("");
                setHistoryIndex(-1);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#aaa",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
              title="Clear (Ctrl+Shift+X)"
            >
              ✖
            </button>
          </div>
          <div style={{ marginTop: "8px" }}>{answer}</div>
        </div>
      )}
    </div>
  );
}
