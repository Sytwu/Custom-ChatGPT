import React from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";

export function SystemPromptInput() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="setting-row">
      <label htmlFor="system-prompt">System Prompt</label>
      <textarea
        id="system-prompt"
        rows={4}
        placeholder="You are a helpful assistant."
        value={state.systemPrompt}
        onChange={(e) =>
          dispatch({ type: ACTIONS.SET_SYSTEM_PROMPT, payload: e.target.value })
        }
      />
    </div>
  );
}
