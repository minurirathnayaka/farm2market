import { useEffect, useRef, useState } from "react";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi 👋 Ask me anything about Farm2Market." },
  ]);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage() {
    if (!input.trim() || sending) return;

    const text = input;
    setInput("");
    setSending(true);

    setMessages((m) => [...m, { role: "user", text }]);

    try {
      const res = await fetch("https://api.farm2market.org/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error("API error");
      }

      const data = await res.json();

      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply || "No response." },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "AI is temporarily unavailable." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating Bubble */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#111",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          fontSize: 22,
        }}
      >
        💬
      </div>

      {/* Chat Window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 340,
            height: 460,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: 12,
              fontWeight: 600,
              borderBottom: "1px solid #eee",
            }}
          >
            Farm2Market Assistant
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: 10,
              overflowY: "auto",
              fontSize: 14,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 8,
                  textAlign: m.role === "user" ? "right" : "left",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: m.role === "user" ? "#111" : "#f1f1f1",
                    color: m.role === "user" ? "#fff" : "#000",
                    maxWidth: "85%",
                  }}
                >
                  {m.text}
                </span>
              </div>
            ))}

            {sending && (
              <div style={{ fontStyle: "italic", opacity: 0.6 }}>
                Assistant is typing…
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: 10,
              borderTop: "1px solid #eee",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message"
              disabled={sending}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid #ccc",
                fontSize: 14,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
