import React, { useEffect, useRef } from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { getActiveMessages } from "../../context/reducer.js";
import { MessageBubble } from "./MessageBubble.jsx";
import { StreamingBubble } from "./StreamingBubble.jsx";
import { DiscordMessageBubble } from "./DiscordMessageBubble.jsx";

const GROUP_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function MessageList({ onReply }) {
  const { state } = useAppContext();
  const messages = getActiveMessages(state);
  const bottomRef = useRef(null);
  const activeConv = state.conversations.find((c) => c.id === state.activeConversationId);
  const isDiscord = activeConv?.discordMode ?? false;

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, state.streamingContent]);

  if (messages.length === 0 && !state.isStreaming) {
    return (
      <div className="message-list empty">
        <p>Start a conversation by typing a message below.</p>
      </div>
    );
  }

  if (isDiscord) {
    return (
      <div className="message-list discord-message-list">
        {messages.map((msg, idx) => {
          const prev = messages[idx - 1];
          const grouped =
            prev &&
            prev.role === msg.role &&
            msg.timestamp - prev.timestamp < GROUP_THRESHOLD_MS;
          return (
            <DiscordMessageBubble
              key={msg.id}
              message={msg}
              grouped={grouped}
              onReply={onReply}
              allMessages={messages}
            />
          );
        })}
        {state.isStreaming && (
          <DiscordMessageBubble
            message={{ id: "__streaming__", role: "assistant", content: state.streamingContent, timestamp: Date.now(), reactions: {}, replyTo: null }}
            grouped={messages.length > 0 && messages[messages.length - 1].role === "assistant"}
            onReply={() => {}}
            allMessages={messages}
          />
        )}
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {state.isStreaming && <StreamingBubble content={state.streamingContent} />}
      <div ref={bottomRef} />
    </div>
  );
}
