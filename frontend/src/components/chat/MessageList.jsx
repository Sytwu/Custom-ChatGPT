import React, { useEffect, useRef } from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { getActiveMessages } from "../../context/reducer.js";
import { MessageBubble } from "./MessageBubble.jsx";
import { StreamingBubble } from "./StreamingBubble.jsx";

export function MessageList() {
  const { state } = useAppContext();
  const messages = getActiveMessages(state);
  const bottomRef = useRef(null);

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
