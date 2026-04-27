import React, { useEffect, useRef } from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { getActiveMessages } from "../../context/reducer.js";
import { MessageBubble } from "./MessageBubble.jsx";
import { StreamingBubble } from "./StreamingBubble.jsx";
import { DiscordMessageBubble } from "./DiscordMessageBubble.jsx";

const GROUP_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function MessageList({ onReply, pendingMessages = [] }) {
  const { state } = useAppContext();
  const messages = getActiveMessages(state);
  const bottomRef = useRef(null);
  const activeConv = state.conversations.find((c) => c.id === state.activeConversationId);
  const isDiscord = activeConv?.discordMode ?? false;

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, state.streamingContent, pendingMessages]);

  if (messages.length === 0 && !state.isStreaming && pendingMessages.length === 0) {
    return (
      <div className="message-list empty">
        <p>Start a conversation by typing a message below.</p>
      </div>
    );
  }

  if (isDiscord) {
    const now = Date.now();
    const fakePending = pendingMessages.map((item, i) => ({
      id: `__pending_${i}`,
      role: "user",
      content: item.content ?? item,        // backwards compat if plain string
      stickerUrl: item.stickerUrl ?? null,
      stickerDescription: item.stickerDescription ?? null,
      replyTo: null,
      reactions: {},
      timestamp: now + i,
    }));

    const allVisible = [...messages, ...fakePending];

    return (
      <div className="message-list discord-message-list">
        {allVisible.map((msg, idx) => {
          const prev = allVisible[idx - 1];
          const grouped =
            prev &&
            prev.role === msg.role &&
            msg.timestamp - prev.timestamp < GROUP_THRESHOLD_MS;
          const isPending = msg.id.startsWith("__pending_");
          return (
            <DiscordMessageBubble
              key={msg.id}
              message={msg}
              grouped={grouped}
              onReply={onReply}
              allMessages={messages}
              pending={isPending}
            />
          );
        })}
        {state.isStreaming && (() => {
          const lastTool = state.streamingToolCalls[state.streamingToolCalls.length - 1];
          const pendingToolName = lastTool?.type === "call" ? lastTool.name : null;
          const streamContent = pendingToolName
            ? state.streamingContent
            : state.streamingContent;
          return (
            <DiscordMessageBubble
              message={{
                id: "__streaming__",
                role: "assistant",
                content: streamContent,
                pendingToolName,
                timestamp: Date.now(),
                reactions: {},
                replyTo: null,
              }}
              grouped={allVisible.length > 0 && allVisible[allVisible.length - 1].role === "assistant"}
              onReply={() => {}}
              allMessages={messages}
              pending={false}
            />
          );
        })()}
        <div ref={bottomRef} />
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {state.isStreaming && (
        <StreamingBubble
          content={state.streamingContent}
          pendingToolName={
            state.streamingToolCalls.length > 0 &&
            state.streamingToolCalls[state.streamingToolCalls.length - 1].type === "call"
              ? state.streamingToolCalls[state.streamingToolCalls.length - 1].name
              : null
          }
          streamingToolCalls={state.streamingToolCalls}
        />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
