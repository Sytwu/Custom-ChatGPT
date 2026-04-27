import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useAppContext } from "../../hooks/useAppContext.js";
import { useChat } from "../../hooks/useChat.js";
import { ACTIONS } from "../../context/actions.js";
import { FileAttachment } from "./FileAttachment.jsx";
import { PromptSuggestions } from "./PromptSuggestions.jsx";
import { StickerPicker } from "./StickerPicker.jsx";
import { extractFromFile } from "../../utils/fileExtractor.js";
import { isVisionModel } from "../../constants/models.js";
import { useT } from "../../i18n/useT.js";

const ACCEPTED_TYPES = ".pdf,.txt,.md,.py,.js,.ts,.jsx,.tsx,.json,.csv,.yaml,.yml,.html,.css,.jpg,.jpeg,.png,.gif,.webp";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const API_BASE = import.meta.env.VITE_API_URL ?? "";

function readImageAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1920;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to read image")); };
    img.src = url;
  });
}

export function InputBar({ replyTo, onCancelReply, msgQueue = [], onAddToQueue, onClearQueue }) {
  const { state, dispatch } = useAppContext();
  const { sendMessage, sendMessageBatch, sendSticker, stopStream } = useChat();
  const t = useT();
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ bottom: 0, left: 0 });
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const stickerBtnRef = useRef(null);

  const hasImage = attachment?.imageData != null;
  const currentModelSupportsVision = isVisionModel(state.model);

  // Detect if active conversation is in Discord mode
  const activeConv = state.conversations.find((c) => c.id === state.activeConversationId);
  const isDiscord = activeConv?.discordMode ?? false;

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

  function handleAddToQueue() {
    if (!text.trim()) return;
    onAddToQueue?.({ content: text.trim() });
    setText("");
    textareaRef.current?.focus();
  }

  function handleSend() {
    if (state.isStreaming) return;
    if (!text.trim() && !attachment && msgQueue.length === 0) return;
    if (hasImage && !currentModelSupportsVision && !state.autoRouting) {
      dispatch({ type: ACTIONS.STREAM_ERROR, payload: t("imageNotSupported") });
      return;
    }

    if (isDiscord) {
      // Combine queue + current text, send as batch
      const all = [
        ...msgQueue,
        ...(text.trim() ? [{ content: text.trim() }] : []),
      ];
      if (all.length === 0 && !attachment) return;
      onClearQueue?.();
      setText("");
      setAttachment(null);
      setShowSuggestions(false);
      setSuggestions(null);
      onCancelReply?.();
      sendMessageBatch(all, attachment, replyTo ?? null);
    } else {
      if (!text.trim() && !attachment) return;
      sendMessage(text, attachment, replyTo ?? null);
      setText("");
      setAttachment(null);
      setShowSuggestions(false);
      setSuggestions(null);
      onCancelReply?.();
    }
    textareaRef.current?.focus();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isDiscord) {
        handleAddToQueue();
      } else {
        handleSend();
      }
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
      setShowStickerPicker(false);
    }
  }

  async function fetchSuggestions() {
    if (!text.trim()) return;
    setLoadingSuggestions(true);
    setShowSuggestions(true);
    setSuggestions(null);
    try {
      const apiKey = state.groqApiKey;

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

  // Close sticker picker when clicking outside the portal or the sticker button
  useEffect(() => {
    if (!showStickerPicker) return;
    function handleOutside(e) {
      if (
        !e.target.closest(".sticker-picker-portal") &&
        !e.target.closest(".sticker-picker-anchor")
      ) {
        setShowStickerPicker(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showStickerPicker]);

  const hasPendingOrText = msgQueue.length > 0 || !!text.trim();

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
      {hasImage && !currentModelSupportsVision && !state.autoRouting && (
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

      {/* Discord Mode: sticker picker — fixed portal to escape overflow constraints */}
      {isDiscord && showStickerPicker && ReactDOM.createPortal(
        <div
          className="sticker-picker-portal"
          style={{ bottom: pickerPos.bottom, left: pickerPos.left }}
        >
          <StickerPicker
            onSelect={({ url, description }) => {
              if (isDiscord) {
                // Queue the sticker as a pending bubble — sent when user presses Send
                onAddToQueue?.({ content: `[sticker: ${description}]`, stickerUrl: url, stickerDescription: description });
              } else {
                sendSticker(url, description, replyTo ?? null);
                onCancelReply?.();
              }
              setShowStickerPicker(false);
            }}
            onClose={() => setShowStickerPicker(false)}
          />
        </div>,
        document.body
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

        {/* Discord Mode: sticker button */}
        {isDiscord && (
          <div className="sticker-picker-anchor">
            <button
              ref={stickerBtnRef}
              className="sticker-btn"
              onClick={() => {
                if (!showStickerPicker && stickerBtnRef.current) {
                  const rect = stickerBtnRef.current.getBoundingClientRect();
                  setPickerPos({
                    bottom: window.innerHeight - rect.top + 8,
                    left: rect.left,
                  });
                }
                setShowStickerPicker((v) => !v);
              }}
              disabled={state.isStreaming}
              title={t("stickers")}
            >
              🖼️
            </button>
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={isDiscord ? t("discordInputPlaceholder") : t("inputPlaceholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={state.isStreaming}
        />

        {state.isStreaming ? (
          <button className="stop-btn" onClick={stopStream} title={t("stopGeneration")}>
            {t("stop")}
          </button>
        ) : isDiscord && msgQueue.length > 0 ? (
          <button
            className="send-all-btn"
            onClick={handleSend}
            disabled={!hasPendingOrText && !attachment}
          >
            {t("sendAll")} ({msgQueue.length + (text.trim() ? 1 : 0)})
          </button>
        ) : (
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={isDiscord ? (!text.trim() && !attachment) : (!text.trim() && !attachment)}
          >
            {t("send")}
          </button>
        )}
      </div>
    </div>
  );
}
