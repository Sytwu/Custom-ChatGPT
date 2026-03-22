import React, { useState } from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { MarkdownContent } from "./MarkdownContent.jsx";
import { useT } from "../../i18n/useT.js";

const AVATAR_COLORS = {
  user: "#7c6af7",
  assistant: "#4caf50",
};

function formatDiscordTime(ts, t) {
  const d = new Date(ts);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `${t("today")} ${timeStr}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();
  if (isYesterday) return `${t("yesterday")} ${timeStr}`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " + timeStr;
}

const EMOJI_LIST = ["❤️", "👍", "😂", "😮", "😢", "🔥"];

/** Emoji reaction bar — shown on hover via parent */
function ReactionPicker({ messageId }) {
  const { dispatch } = useAppContext();
  return (
    <div className="discord-reaction-picker">
      {EMOJI_LIST.map((emoji) => (
        <button
          key={emoji}
          className="discord-reaction-pick-btn"
          onClick={() =>
            dispatch({ type: ACTIONS.TOGGLE_REACTION, payload: { messageId, emoji } })
          }
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export function DiscordMessageBubble({ message, grouped, onReply, allMessages, pending = false }) {
  const { dispatch } = useAppContext();
  const t = useT();
  const [hovering, setHovering] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const isUser = message.role === "user";
  const username = isUser ? "You" : "Assistant";
  const avatarLetter = isUser ? "Y" : "A";
  const avatarColor = AVATAR_COLORS[message.role];

  const reactions = message.reactions ?? {};
  const hasReactions = Object.keys(reactions).length > 0;

  // Resolve replied message snippet from allMessages
  const repliedMsg = message.replyTo
    ? allMessages.find((m) => m.id === message.replyTo.id)
    : null;
  const replySnippet = repliedMsg
    ? repliedMsg.content.slice(0, 60) + (repliedMsg.content.length > 60 ? "…" : "")
    : message.replyTo?.snippet ?? "";

  return (
    <div
      className={`discord-msg${grouped ? " grouped" : ""}${pending ? " pending" : ""}`}
      onMouseEnter={() => !pending && setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowPicker(false); }}
    >
      {/* Avatar — hidden for grouped messages */}
      {!grouped ? (
        <div className="discord-avatar" style={{ background: avatarColor }}>
          {avatarLetter}
        </div>
      ) : (
        <div className="discord-avatar-placeholder" />
      )}

      <div className="discord-msg-body">
        {/* Username + timestamp — hidden for grouped messages */}
        {!grouped && (
          <div className="discord-meta">
            <span className="discord-username">{username}</span>
            <span className="discord-timestamp">{formatDiscordTime(message.timestamp, t)}</span>
          </div>
        )}

        {/* Reply quote */}
        {message.replyTo && (
          <div className="discord-reply-quote">
            <span className="discord-reply-icon">↩</span>
            <span className="discord-reply-text">
              {repliedMsg?.role === "user" ? "You" : "Assistant"}: {replySnippet}
            </span>
          </div>
        )}

        {/* Message content */}
        <div className="discord-content">
          {isUser && message.stickerUrl ? (
            /* Sticker message — show image only, text goes to LLM not UI */
            <img
              src={message.stickerUrl}
              alt={message.stickerDescription ?? "sticker"}
              className="discord-sticker-img"
            />
          ) : isUser ? (
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

        {/* Reactions row */}
        {hasReactions && (
          <div className="discord-reactions">
            {Object.entries(reactions).map(([emoji, count]) => (
              <button
                key={emoji}
                className="discord-reaction-btn active"
                onClick={() =>
                  dispatch({ type: ACTIONS.TOGGLE_REACTION, payload: { messageId: message.id, emoji } })
                }
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover action toolbar — not shown for pending messages */}
      {hovering && !pending && (
        <div className="discord-hover-actions">
          <div style={{ position: "relative" }}>
            <button
              className="discord-hover-btn"
              title={t("addReaction")}
              onClick={() => setShowPicker((v) => !v)}
            >
              😊
            </button>
            {showPicker && (
              <ReactionPicker messageId={message.id} />
            )}
          </div>
          <button
            className="discord-hover-btn"
            title={t("replyingTo")}
            onClick={() => onReply(message)}
          >
            ↩
          </button>
        </div>
      )}
    </div>
  );
}
