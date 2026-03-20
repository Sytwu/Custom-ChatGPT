import React from "react";
import { MarkdownContent } from "./MarkdownContent.jsx";

export function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`message-bubble ${isUser ? "user" : "assistant"}`}>
      <div className="message-role">{isUser ? "You" : "Assistant"}</div>
      <div className="message-content">
        {isUser ? (
          <>
            {message.content && <span>{message.content}</span>}
            {message.attachmentName && (
              <div className="message-attachment-chip">
                <span>📎</span>
                <span className="message-attachment-name">{message.attachmentName}</span>
              </div>
            )}
          </>
        ) : (
          <MarkdownContent content={message.content} />
        )}
      </div>
    </div>
  );
}
