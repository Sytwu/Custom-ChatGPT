import React from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";

export function TemperatureSlider() {
  const { state, dispatch } = useAppContext();

  return (
    <div className="setting-row">
      <label htmlFor="temperature">
        Temperature <span className="value-badge">{state.temperature.toFixed(1)}</span>
      </label>
      <input
        id="temperature"
        type="range"
        min="0"
        max="2"
        step="0.1"
        value={state.temperature}
        onChange={(e) =>
          dispatch({ type: ACTIONS.SET_TEMPERATURE, payload: parseFloat(e.target.value) })
        }
      />
      <div className="range-labels">
        <span>Precise (0)</span>
        <span>Creative (2)</span>
      </div>
    </div>
  );
}
