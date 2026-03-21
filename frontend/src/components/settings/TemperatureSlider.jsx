import React from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { useT } from "../../i18n/useT.js";

export function TemperatureSlider() {
  const { state, dispatch } = useAppContext();
  const t = useT();

  return (
    <div className="setting-row">
      <label htmlFor="temperature">
        {t("temperature")} <span className="value-badge">{state.temperature.toFixed(1)}</span>
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
        <span>{t("precise")}</span>
        <span>{t("creative")}</span>
      </div>
    </div>
  );
}
