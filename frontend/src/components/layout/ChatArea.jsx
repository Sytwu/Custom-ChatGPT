import React from "react";
import { MessageList } from "../chat/MessageList.jsx";
import { InputBar } from "../chat/InputBar.jsx";

export function ChatArea() {
  return (
    <main className="chat-area">
      <MessageList />
      <InputBar />
    </main>
  );
}
