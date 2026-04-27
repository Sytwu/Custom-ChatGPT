import React, { useState } from "react";
import { useT } from "../../i18n/useT.js";

const TOOL_ICONS = {
  web_search: "🔍",
  python_execute: "🐍",
};

function ToolCallPair({ call, result }) {
  const [expanded, setExpanded] = useState(true);
  const t = useT();
  const icon = TOOL_ICONS[call.name] ?? "🔧";

  const headerLabel =
    call.name === "web_search"
      ? call.input?.query ?? ""
      : call.name === "python_execute"
      ? "Python"
      : call.name;

  const inputDisplay =
    call.name === "python_execute"
      ? call.input?.code ?? ""
      : JSON.stringify(call.input ?? {}, null, 2);

  const isPending = !result;

  return (
    <div className="tool-call-pair">
      <button className="tool-call-header" onClick={() => setExpanded((v) => !v)}>
        <span className="tool-call-icon">{icon}</span>
        <span className="tool-call-name">{call.name}</span>
        <span className="tool-call-summary">{headerLabel}</span>
        {isPending && <span className="tool-call-pending">⏳</span>}
        <span className="tool-call-toggle">{expanded ? t("toolCallsCollapse") : t("toolCallsExpand")}</span>
      </button>
      {expanded && (
        <div className="tool-call-body">
          <div className="tool-call-section">
            <span className="tool-call-label">Input</span>
            <pre className="tool-call-pre">{inputDisplay}</pre>
          </div>
          <div className="tool-call-section">
            <span className="tool-call-label">Output</span>
            {isPending
              ? <div className="tool-call-pending-output">⏳ {t("toolRunningCode")}...</div>
              : <pre className="tool-call-pre">{result.output}</pre>
            }
          </div>
        </div>
      )}
    </div>
  );
}

export function ToolCallBlock({ toolCalls }) {
  if (!toolCalls || toolCalls.length === 0) return null;
  const t = useT();

  // Pair up calls and results — a trailing call with no result is shown as pending
  const pairs = [];
  let i = 0;
  while (i < toolCalls.length) {
    if (toolCalls[i].type === "call") {
      const call = toolCalls[i];
      const result = toolCalls[i + 1]?.type === "result" ? toolCalls[i + 1] : null;
      pairs.push({ call, result });
      i += result ? 2 : 1;
    } else {
      i++;
    }
  }

  if (pairs.length === 0) return null;

  return (
    <div className="tool-call-block">
      <div className="tool-call-block-label">{t("toolCallsLabel")}</div>
      {pairs.map((pair, idx) => (
        <ToolCallPair key={idx} call={pair.call} result={pair.result} />
      ))}
    </div>
  );
}
