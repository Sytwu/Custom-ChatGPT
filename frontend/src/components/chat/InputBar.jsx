import React, { useState, useRef } from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { useChat } from "../../hooks/useChat.js";
import { ACTIONS } from "../../context/actions.js";

export function InputBar() {
  const { state, dispatch } = useAppContext();
  const { sendMessage } = useChat();
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  function handleSend() {
    if (!text.trim() || state.isStreaming) return;
    sendMessage(text);
    setText("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="input-bar">
      {state.error && (
        <div className="error-banner">
          <span>{state.error}</span>
          <button onClick={() => dispatch({ type: ACTIONS.CLEAR_ERROR })}>×</button>
        </div>
      )}
      <div className="input-row">
        <textarea
          ref={textareaRef}
          rows={2}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={state.isStreaming}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={state.isStreaming || !text.trim()}
        >
          {state.isStreaming ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
