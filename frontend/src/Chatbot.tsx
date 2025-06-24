import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");

 useEffect(() => {
  axios.get(`http://localhost:5000/api/chat/history/${sessionId}`).then((res) => {
    setMessages(res.data); // assuming compatible structure
  });
}, []);

// generate sessionId on first load
const sessionId = useMemo(() => {
  return (
    localStorage.getItem("sessionId") ||
    (() => {
      const id = crypto.randomUUID();
      localStorage.setItem("sessionId", id);
      return id;
    })()
  );
}, []);

  const sendMessage = async () => {
  if (!input.trim()) return;

  const userMsg = { sender: "user" as const, text: input };
  setMessages((prev) => [...prev, userMsg]);

  try {
    const res = await axios.post("http://localhost:5000/api/chat", {
      message: input,
      sessionId: sessionId, // ✅ include sessionId here
    });

    const botMsg = res.data.reply;
    setMessages((prev) => [...prev, { sender: "bot", text: botMsg }]);
  } catch (err) {
    console.error(err);
    setMessages((prev) => [
      ...prev,
      { sender: "bot", text: "⚠️ Something went wrong." },
    ]);
  }

  setInput("");
};

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", fontFamily: "Arial" }}>
      <h2>💬 Chat with Assistant</h2>
      <div
        style={{
          height: "350px",
          border: "1px solid #ccc",
          padding: "10px",
          borderRadius: "8px",
          overflowY: "scroll",
          marginBottom: "10px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.sender === "user" ? "right" : "left" }}>
            <p
              style={{
                display: "inline-block",
                padding: "10px",
                borderRadius: "10px",
                margin: "6px 0",
                backgroundColor: msg.sender === "user" ? "#dcf8c6" : "#e8e8e8",
              }}
            >
              {msg.text}
            </p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{
            flexGrow: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "#00aaff",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
