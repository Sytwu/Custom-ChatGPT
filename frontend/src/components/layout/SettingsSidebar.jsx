import React, { useState } from "react";
import { ModelSelector } from "../settings/ModelSelector.jsx";
import { SystemPromptInput } from "../settings/SystemPromptInput.jsx";
import { TemperatureSlider } from "../settings/TemperatureSlider.jsx";
import { MaxTokensInput } from "../settings/MaxTokensInput.jsx";
import { MemoryControls } from "../settings/MemoryControls.jsx";
import { ApiKeyInputs } from "../settings/ApiKeyInputs.jsx";

export function SettingsSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar settings-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <button
          className="collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand settings" : "Collapse settings"}
        >
          {collapsed ? "«" : "»"}
        </button>
        {!collapsed && <h2>Settings</h2>}
      </div>

      {!collapsed && (
        <div className="sidebar-content">
          <ApiKeyInputs />
          <hr />
          <ModelSelector />
          <hr />
          <SystemPromptInput />
          <hr />
          <TemperatureSlider />
          <MaxTokensInput />
          <hr />
          <MemoryControls />
        </div>
      )}
    </aside>
  );
}
