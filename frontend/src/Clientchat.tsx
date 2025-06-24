import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:5000");

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
}

interface User {
  id: number;
  name: string;
}

const ChatApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [receiver, setReceiver] = useState<User | null>(null);

  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const senderId = user?.id;
  const role = user?.role;

  // ✅ Join room + listen for messages
  useEffect(() => {
    if (!senderId) return;

    socket.emit("join", senderId);

    socket.on("receive_message", (message: Message) => {
      if (message.senderId === senderId || message.receiverId === senderId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [senderId]);

  // ✅ Fetch chat history
  useEffect(() => {
    if (!token) return;

    axios
      .get("http://localhost:5000/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("Error fetching messages:", err));
  }, [token]);

  // ✅ Get receiver (only if user)
  useEffect(() => {
    if (role === "user") {
      axios
        .get("http://localhost:5000/api/users/first-service")
        .then((res) => setReceiver(res.data))
        .catch((err) => console.error("No service user found", err));
    }
  }, [role]);

  const sendMessage = () => {
  if (!input || !senderId) return;

  const newMessage = {
    id: Date.now(), // temporary ID
    senderId,
    receiverId: receiver?.id || 0,
    content: input,
  };

  setMessages((prev) => [...prev, newMessage]); // optimistically update UI

  socket.emit("send_message", {
    token: localStorage.getItem("token"),
    content: input,
  });

  setInput("");
};


  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h2>💬 Chat</h2>

      <div
        style={{
          height: "300px",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "10px",
          background: "#f9f9f9",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              margin: "5px 0",
              textAlign: msg.senderId === senderId ? "right" : "left",
            }}
          >
            <strong>{msg.senderId === senderId ? "You" : "Them"}:</strong>{" "}
            {msg.content}
          </div>
        ))}
      </div>

      <div>
        <input
          type="text"
          placeholder="Type your message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: "75%", padding: "8px" }}
        />
        <button
          onClick={sendMessage}
          style={{ padding: "8px", marginLeft: "10px" }}
          disabled={role === "user" && !receiver}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatApp;
