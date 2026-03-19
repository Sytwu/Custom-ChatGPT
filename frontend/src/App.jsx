import React from "react";
import { AppProvider } from "./context/AppContext.jsx";
import { Sidebar } from "./components/layout/Sidebar.jsx";
import { ChatArea } from "./components/layout/ChatArea.jsx";

export default function App() {
  return (
    <AppProvider>
      <div className="app-layout">
        <header className="app-header">
          <h1>Custom ChatGPT</h1>
        </header>
        <div className="app-body">
          <Sidebar />
          <ChatArea />
        </div>
      </div>
    </AppProvider>
  );
}
