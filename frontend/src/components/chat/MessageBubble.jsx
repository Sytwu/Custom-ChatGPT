import React from "react";

export function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`message-bubble ${isUser ? "user" : "assistant"}`}>
      <div className="message-role">{isUser ? "You" : "Assistant"}</div>
      <div className="message-content">{message.content}</div>
    </div>
  );
}
