import React from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { Toggle } from "../ui/Toggle.jsx";

export function MemoryControls() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="setting-group">
      <Toggle
        label="Short-term Memory"
        checked={state.memoryEnabled}
        onChange={() => dispatch({ type: ACTIONS.TOGGLE_MEMORY })}
      />
      {state.memoryEnabled && (
        <div className="setting-row indent">
          <label htmlFor="memory-cutoff">
            Keep last <span className="value-badge">{state.memoryCutoff}</span> turns
          </label>
          <input
            id="memory-cutoff"
            type="number"
            min="1"
            max="50"
            value={state.memoryCutoff}
            onChange={(e) =>
              dispatch({ type: ACTIONS.SET_CUTOFF, payload: parseInt(e.target.value, 10) })
            }
          />
          <p className="hint">
            1 turn = 1 Q&A pair. Max {state.memoryCutoff * 2} messages sent per request.
          </p>
        </div>
      )}
      {!state.memoryEnabled && (
        <p className="hint">Memory off — only the current message is sent.</p>
      )}
    </div>
  );
}
