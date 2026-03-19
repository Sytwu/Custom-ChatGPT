import React from "react";
import { MODELS } from "../../constants/models.js";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";

export function ModelSelector() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="setting-row">
      <label htmlFor="model-select">Model</label>
      <select
        id="model-select"
        value={state.model}
        onChange={(e) => dispatch({ type: ACTIONS.SET_MODEL, payload: e.target.value })}
        disabled={state.isStreaming}
      >
        {MODELS.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
