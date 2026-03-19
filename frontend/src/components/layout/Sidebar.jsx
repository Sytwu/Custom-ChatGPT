import React, { useState } from "react";
import { ModelSelector } from "../settings/ModelSelector.jsx";
import { SystemPromptInput } from "../settings/SystemPromptInput.jsx";
import { TemperatureSlider } from "../settings/TemperatureSlider.jsx";
import { MaxTokensInput } from "../settings/MaxTokensInput.jsx";
import { MemoryControls } from "../settings/MemoryControls.jsx";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";

export function Sidebar() {
  const { state, dispatch } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <h2>Settings</h2>}
        <button
          className="collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand settings" : "Collapse settings"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-content">
          <ModelSelector />
          <hr />
          <SystemPromptInput />
          <hr />
          <TemperatureSlider />
          <MaxTokensInput />
          <hr />
          <MemoryControls />
          <hr />
          <button
            className="clear-btn"
            onClick={() => dispatch({ type: ACTIONS.CLEAR_MESSAGES })}
            disabled={state.isStreaming || state.messages.length === 0}
          >
            Clear Conversation
          </button>
        </div>
      )}
    </aside>
  );
}
