import React from "react";
import { MarkdownContent } from "./MarkdownContent.jsx";
import { ToolCallBlock } from "./ToolCallBlock.jsx";
import { useT } from "../../i18n/useT.js";

export function StreamingBubble({ content, pendingToolName, streamingToolCalls }) {
  const t = useT();

  // If we have live tool call data, use ToolCallBlock for richer display
  const hasToolCalls = streamingToolCalls && streamingToolCalls.length > 0;

  // Show a simple label only when a tool is pending but no structured data yet
  const lastEntry = streamingToolCalls?.[streamingToolCalls.length - 1];
  const isWaitingForResult = lastEntry?.type === "call";
  const showFallbackLabel = pendingToolName && !hasToolCalls;

  const fallbackLabel =
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
        {hasToolCalls && <ToolCallBlock toolCalls={streamingToolCalls} />}
        {showFallbackLabel && fallbackLabel && (
          <div className="tool-loading-indicator">{fallbackLabel}</div>
        )}
        {content && <MarkdownContent content={content} />}
        <span className="cursor-blink">|</span>
      </div>
    </div>
  );
}
