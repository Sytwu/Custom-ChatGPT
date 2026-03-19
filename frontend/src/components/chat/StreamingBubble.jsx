import React from "react";

export function StreamingBubble({ content }) {
  return (
    <div className="message-bubble assistant">
      <div className="message-role">Assistant</div>
      <div className="message-content">
        {content}
        <span className="cursor-blink">|</span>
      </div>
    </div>
  );
}
