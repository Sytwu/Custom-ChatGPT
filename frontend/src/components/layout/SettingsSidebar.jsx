import React, { useState } from "react";
import { ModelSelector } from "../settings/ModelSelector.jsx";
import { SystemPromptInput } from "../settings/SystemPromptInput.jsx";
import { TemperatureSlider } from "../settings/TemperatureSlider.jsx";
import { MaxTokensInput } from "../settings/MaxTokensInput.jsx";
import { MemoryControls } from "../settings/MemoryControls.jsx";
import { RoutingSettings } from "../settings/RoutingSettings.jsx";
import { MemorySettings } from "../settings/MemorySettings.jsx";
import { ApiKeyInputs } from "../settings/ApiKeyInputs.jsx";
import { useT } from "../../i18n/useT.js";

const TABS = ["settings", "memory"];

export function SettingsSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const t = useT();

  return (
    <aside className={`sidebar settings-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button
          className="collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? t("expandSettings") : t("collapseSettings")}
        >
          {collapsed ? "«" : "»"}
        </button>
        {!collapsed && <h2>{t("settings")}</h2>}
      </div>

      {!collapsed && (
        <>
          <div className="settings-tabs">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`settings-tab-btn${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "settings" ? t("settings") : t("memory")}
              </button>
            ))}
          </div>

          <div className="sidebar-content">
            {activeTab === "settings" ? (
              <>
                <ApiKeyInputs />
                <hr />
                <RoutingSettings />
                <ModelSelector />
                <hr />
                <SystemPromptInput />
                <hr />
                <TemperatureSlider />
                <MaxTokensInput />
                <hr />
                <MemoryControls />
              </>
            ) : (
              <MemorySettings />
            )}
          </div>
        </>
      )}
    </aside>
  );
}
