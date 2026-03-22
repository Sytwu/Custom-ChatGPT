import React, { useState, useEffect } from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { MessageList } from "../chat/MessageList.jsx";
import { InputBar } from "../chat/InputBar.jsx";

export function ChatArea() {
  const { state } = useAppContext();
  const [replyTo, setReplyTo] = useState(null); // { id, snippet, role }
  const [msgQueue, setMsgQueue] = useState([]); // pending Discord messages

  // Reset queue and reply when switching conversations
  useEffect(() => {
    setMsgQueue([]);
    setReplyTo(null);
  }, [state.activeConversationId]);

  return (
    <main className="chat-area">
      <MessageList
        onReply={(msg) => setReplyTo({ id: msg.id, snippet: msg.content.slice(0, 80), role: msg.role })}
        pendingMessages={msgQueue}
      />
      <InputBar
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        msgQueue={msgQueue}
        onAddToQueue={(text) => setMsgQueue((q) => [...q, text])}
        onClearQueue={() => setMsgQueue([])}
      />
    </main>
  );
}
