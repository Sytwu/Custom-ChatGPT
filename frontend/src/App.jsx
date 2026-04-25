import React from "react";
import { AppProvider } from "./context/AppContext.jsx";
import { ConversationSidebar } from "./components/layout/ConversationSidebar.jsx";
import { ChatArea } from "./components/layout/ChatArea.jsx";
import { SettingsSidebar } from "./components/layout/SettingsSidebar.jsx";
import { useAppContext } from "./hooks/useAppContext.js";
import { ACTIONS } from "./context/actions.js";
import { useT } from "./i18n/useT.js";
import { LoginButton } from "./components/auth/LoginButton.jsx";

function HeaderControls() {
  const { state, dispatch } = useAppContext();
  const t = useT();
  const isDark = state.theme === "dark";
  const isZH = state.language === "zh-TW";

  return (
    <div className="header-controls">
      <button
        className="header-btn"
        onClick={() => dispatch({ type: ACTIONS.SET_THEME, payload: isDark ? "light" : "dark" })}
        title={isDark ? "切換為淺色 / Switch to light mode" : "切換為深色 / Switch to dark mode"}
      >
        {isDark ? "☀️" : "🌙"}
      </button>
      <button
        className="header-btn"
        onClick={() => dispatch({ type: ACTIONS.SET_LANGUAGE, payload: isZH ? "en" : "zh-TW" })}
        title={isZH ? "Switch to English" : "切換為繁體中文"}
      >
        {isZH ? "EN" : "中"}
      </button>
      <LoginButton />
    </div>
  );
}

function AppInner() {
  const t = useT();
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>{t("appTitle")}</h1>
        <HeaderControls />
      </header>
      <div className="app-body">
        <ConversationSidebar />
        <ChatArea />
        <SettingsSidebar />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
