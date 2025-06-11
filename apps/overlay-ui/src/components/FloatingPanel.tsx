import React, { useState } from 'react';

export default function FloatingPanel() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');

  const askCasper = async () => {
    if (!input.trim()) return;

    const res = await fetch('http://localhost:8080/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input }),
    });

    const data = await res.json();
    setResponse(data.output || 'No response');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 40,
      right: 40,
      backgroundColor: '#1f1f1fdd',
      color: 'white',
      borderRadius: '12px',
      padding: '16px',
      width: '320px',
      zIndex: 10000,
      pointerEvents: 'auto',
    }}>
      <strong>Ask Casper 👻</strong>
      <textarea
        placeholder="Ask anything..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        style={{
          width: '100%',
          borderRadius: '8px',
          marginTop: '8px',
          padding: '8px',
          resize: 'none',
        }}
      />
      <button
        onClick={askCasper}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: '#4f46e5',
          border: 'none',
          color: 'white',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Submit
      </button>

      {response && (
        <div style={{ marginTop: '12px', fontSize: '0.9rem', color: '#a3a3a3' }}>
          <strong>Response:</strong><br />
          {response}
        </div>
      )}
    </div>
  );
}
