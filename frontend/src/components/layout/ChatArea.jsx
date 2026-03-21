import React, { useState } from "react";
import { MessageList } from "../chat/MessageList.jsx";
import { InputBar } from "../chat/InputBar.jsx";

export function ChatArea() {
  const [replyTo, setReplyTo] = useState(null); // { id, snippet, role }

  return (
    <main className="chat-area">
      <MessageList onReply={(msg) => setReplyTo({ id: msg.id, snippet: msg.content.slice(0, 80), role: msg.role })} />
      <InputBar replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
    </main>
  );
}
