import React, { useState } from "react";
import { MarkdownContent } from "./MarkdownContent.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useMemory } from "../../hooks/useMemory.js";
import { useAppContext } from "../../hooks/useAppContext.js";
import { getActiveMessages, apiContent } from "../../context/reducer.js";
import { useT } from "../../i18n/useT.js";
import { ToolCallBlock } from "./ToolCallBlock.jsx";

export function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const { isLoggedIn } = useAuth();
  const { extractMemories } = useMemory();
  const { state } = useAppContext();
  const t = useT();
  const [toast, setToast] = useState(null);
  const [extracting, setExtracting] = useState(false);

  async function handleExtract() {
    if (extracting) return;
    setExtracting(true);
    try {
      const messages = getActiveMessages(state).map((m) => ({ role: m.role, content: apiContent(m) }));
      const result = await extractMemories(messages, state.model, state.groqApiKey);
      const count = result?.extracted?.length ?? 0;
      setToast(count > 0 ? t("memoryExtracted", count) : t("noNewMemory"));
    } catch {
      setToast(t("memoryExtractFailed"));
    } finally {
      setExtracting(false);
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <div className={`message-bubble ${isUser ? "user" : "assistant"}`}>
      <div className="message-role">
        {isUser ? "You" : "Assistant"}
        {!isUser && message.model && (
          <span className="message-model-badge">{message.model}</span>
        )}
      </div>
      <div className="message-content">
        {isUser ? (
          <>
            {message.content && <span>{message.content}</span>}
            {message.attachmentImageData && (
              <div className="message-image-preview">
                <img
                  src={message.attachmentImageData}
                  alt={message.attachmentName ?? "image"}
                  className="message-image-thumb"
                />
              </div>
            )}
            {message.attachmentName && !message.attachmentImageData && (
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
      {!isUser && message.toolCalls && (
        <ToolCallBlock toolCalls={message.toolCalls} />
      )}
      {!isUser && message.compressed && (
        <div className="message-actions">
          <span className="compressed-badge">⚡ 已壓縮</span>
        </div>
      )}
      {!isUser && !message.compressed && isLoggedIn && (
        <div className="message-actions">
          <button
            className="extract-memory-btn"
            title={t("extractMemory")}
            onClick={handleExtract}
            disabled={extracting}
          >
            🧠 {t("extractMemory")}
          </button>
          {toast && <span className="extract-toast">{toast}</span>}
        </div>
      )}
    </div>
  );
}
