import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { useChat } from "../../hooks/useChat.js";
import { ACTIONS } from "../../context/actions.js";
import { FileAttachment } from "./FileAttachment.jsx";
import { PromptSuggestions } from "./PromptSuggestions.jsx";
import { extractFromFile } from "../../utils/fileExtractor.js";
import { isVisionModel } from "../../constants/models.js";
import { useT } from "../../i18n/useT.js";

const ACCEPTED_TYPES = ".pdf,.txt,.md,.py,.js,.ts,.jsx,.tsx,.json,.csv,.yaml,.yml,.html,.css,.jpg,.jpeg,.png,.gif,.webp";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const API_BASE = import.meta.env.VITE_API_URL ?? "";
const NVIDIA_PREFIXES = ["nvidia/", "meta/", "mistralai/", "google/", "microsoft/", "deepseek-ai/", "qwen/", "moonshotai/"];

function readImageAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function InputBar({ replyTo, onCancelReply }) {
  const { state, dispatch } = useAppContext();
  const { sendMessage, stopStream } = useChat();
  const t = useT();
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const hasImage = attachment?.imageData != null;
  const currentModelSupportsVision = isVisionModel(state.model);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setExtracting(true);

    if (IMAGE_TYPES.has(file.type)) {
      try {
        const imageData = await readImageAsDataURL(file);
        setAttachment({ name: file.name, imageData });
      } catch (err) {
        dispatch({ type: ACTIONS.STREAM_ERROR, payload: `Image error: ${err.message}` });
      }
    } else {
      const result = await extractFromFile(file);
      if (result.error) {
        dispatch({ type: ACTIONS.STREAM_ERROR, payload: `File error: ${result.error}` });
      } else {
        setAttachment(result);
      }
    }
    setExtracting(false);
  }

  function handleSend() {
    if (state.isStreaming) return;
    if (!text.trim() && !attachment) return;
    if (hasImage && !currentModelSupportsVision) {
      dispatch({ type: ACTIONS.STREAM_ERROR, payload: t("imageNotSupported") });
      return;
    }
    sendMessage(text, attachment, replyTo ?? null);
    setText("");
    setAttachment(null);
    setShowSuggestions(false);
    setSuggestions(null);
    onCancelReply?.();
    textareaRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  async function fetchSuggestions() {
    if (!text.trim()) return;
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    setSuggestions(null);
    try {
      const isNvidia = NVIDIA_PREFIXES.some((p) => state.model.startsWith(p));
      const apiKey = isNvidia ? state.nvidiaApiKey : state.groqApiKey;

      const body = { text: text.trim(), model: state.model };
      if (apiKey) body.apiKey = apiKey;


      const res = await fetch(`${API_BASE}/api/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("suggest failed");
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions({ error: true });
    } finally {
      setLoadingSuggestions(false);
    }
  }

  // Close suggestion panel when clicking outside
  useEffect(() => {
    if (!showSuggestions) return;
    function handleOutside(e) {
      if (!e.target.closest(".input-bar")) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showSuggestions]);

  return (
    <div className="input-bar">
      {replyTo && (
        <div className="reply-banner">
          <span className="reply-banner-label">↩ {t("replyingTo")}</span>
          <span className="reply-banner-snippet">
            {replyTo.role === "user" ? "You" : "Assistant"}: {replyTo.snippet}
          </span>
          <button className="reply-banner-cancel" onClick={onCancelReply} title={t("cancelReply")}>×</button>
        </div>
      )}
      {state.error && (
        <div className="error-banner">
          <span>{state.error}</span>
          <button onClick={() => dispatch({ type: ACTIONS.CLEAR_ERROR })}>×</button>
        </div>
      )}
      {hasImage && !currentModelSupportsVision && (
        <div className="vision-warning">
          ⚠️ {t("visionModelRequired")}
        </div>
      )}
      {attachment && (
        <FileAttachment attachment={attachment} onRemove={() => setAttachment(null)} />
      )}
      {showSuggestions && (
        <PromptSuggestions
          loading={loadingSuggestions}
          suggestions={suggestions}
          onApplyImproved={(improved) => { setText(improved); setShowSuggestions(false); textareaRef.current?.focus(); }}
          onApplyTemplate={(tmpl) => { setText(tmpl); setShowSuggestions(false); textareaRef.current?.focus(); }}
          onClose={() => setShowSuggestions(false)}
        />
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
          title={t("attachFile")}
        >
          {extracting ? "⏳" : "📎"}
        </button>
        <button
          className="suggest-btn"
          onClick={fetchSuggestions}
          disabled={state.isStreaming || !text.trim()}
          title={t("suggestBtn")}
        >
          ✨
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={t("inputPlaceholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={state.isStreaming}
        />
        {state.isStreaming ? (
          <button className="stop-btn" onClick={stopStream} title={t("stopGeneration")}>
            {t("stop")}
          </button>
        ) : (
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!text.trim() && !attachment}
          >
            {t("send")}
          </button>
        )}
      </div>
    </div>
  );
}
