import React, { useState, useRef } from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { useChat } from "../../hooks/useChat.js";
import { ACTIONS } from "../../context/actions.js";
import { FileAttachment } from "./FileAttachment.jsx";
import { extractFromFile } from "../../utils/fileExtractor.js";

const ACCEPTED_TYPES = ".pdf,.txt,.md,.py,.js,.ts,.jsx,.tsx,.json,.csv,.yaml,.yml,.html,.css";

export function InputBar() {
  const { state, dispatch } = useAppContext();
  const { sendMessage, stopStream } = useChat();
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setExtracting(true);
    const result = await extractFromFile(file);
    setExtracting(false);
    if (result.error) {
      dispatch({ type: ACTIONS.STREAM_ERROR, payload: `File error: ${result.error}` });
    } else {
      setAttachment(result);
    }
  }

  function handleSend() {
    if (state.isStreaming) return;
    if (!text.trim() && !attachment) return;
    sendMessage(text, attachment);
    setText("");
    setAttachment(null);
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
      {attachment && (
        <FileAttachment attachment={attachment} onRemove={() => setAttachment(null)} />
      )}
      <div className="input-row">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={state.isStreaming || extracting}
          title="Attach file (PDF, TXT, code files…)"
        >
          {extracting ? "⏳" : "📎"}
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={state.isStreaming}
        />
        {state.isStreaming ? (
          <button className="stop-btn" onClick={stopStream} title="Stop generation">
            ⏹ Stop
          </button>
        ) : (
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!text.trim() && !attachment}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
