import React from "react";
import { MarkdownContent } from "./MarkdownContent.jsx";

export function StreamingBubble({ content }) {
  return (
    <div className="message-bubble assistant">
      <div className="message-role">Assistant</div>
      <div className="message-content">
        <MarkdownContent content={content} />
        <span className="cursor-blink">|</span>
      </div>
    </div>
  );
}
