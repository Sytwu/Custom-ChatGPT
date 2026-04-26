import React from "react";
import { MarkdownContent } from "./MarkdownContent.jsx";
import { useT } from "../../i18n/useT.js";

export function StreamingBubble({ content, pendingToolName }) {
  const t = useT();
  const toolLabel =
    pendingToolName === "web_search"
      ? `🔍 ${t("toolSearching")}`
      : pendingToolName === "python_execute"
      ? `🐍 ${t("toolRunningCode")}`
      : pendingToolName
      ? `🔧 ${pendingToolName}…`
      : null;

  return (
    <div className="message-bubble assistant">
      <div className="message-role">Assistant</div>
      <div className="message-content">
        {toolLabel && <div className="tool-loading-indicator">{toolLabel}</div>}
        {content && <MarkdownContent content={content} />}
        <span className="cursor-blink">|</span>
      </div>
    </div>
  );
}
