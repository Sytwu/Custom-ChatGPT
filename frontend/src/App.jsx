import React from "react";
import { AppProvider } from "./context/AppContext.jsx";
import { ConversationSidebar } from "./components/layout/ConversationSidebar.jsx";
import { ChatArea } from "./components/layout/ChatArea.jsx";
import { SettingsSidebar } from "./components/layout/SettingsSidebar.jsx";

export default function App() {
  return (
    <AppProvider>
      <div className="app-layout">
        <header className="app-header">
          <h1>Custom ChatGPT</h1>
        </header>
        <div className="app-body">
          <ConversationSidebar />
          <ChatArea />
          <SettingsSidebar />
        </div>
      </div>
    </AppProvider>
  );
}
