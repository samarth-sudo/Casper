import React, { useState, useEffect } from "react";

export default function App() {
  const [mode, setMode] = useState("translate");
  const [answer, setAnswer] = useState("");

  // Fetch new response every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8080/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode }),
        });

        const data = await res.json();
        setAnswer(data.answer);
      } catch (err) {
        console.error("Casper backend error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [mode]);

  // Handle key: Ctrl+Shift+X to clear
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "x") {
        setAnswer("");
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

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

      {/* Resizable Output Box */}
      {answer && (
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 30,
            width: "400px",
            minHeight: "120px",
            resize: "both",
            overflow: "auto",
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
              onClick={() => setAnswer("")}
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
