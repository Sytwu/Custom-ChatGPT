import React from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { Toggle } from "../ui/Toggle.jsx";
import { useT } from "../../i18n/useT.js";

export function MemoryControls() {
  const { state, dispatch } = useAppContext();
  const t = useT();

  return (
    <div className="setting-group">
      <Toggle
        label={t("shortTermMemory")}
        checked={state.memoryEnabled}
        onChange={() => dispatch({ type: ACTIONS.TOGGLE_MEMORY })}
      />
      {state.memoryEnabled && (
        <div className="setting-row indent">
          <label htmlFor="memory-cutoff">
            {t("keepLastTurns")} <span className="value-badge">{state.memoryCutoff}</span> {t("turns")}
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
          <p className="hint">{t("memoryHint", state.memoryCutoff)}</p>
        </div>
      )}
      {!state.memoryEnabled && (
        <p className="hint">{t("memoryOffHint")}</p>
      )}
    </div>
  );
}
