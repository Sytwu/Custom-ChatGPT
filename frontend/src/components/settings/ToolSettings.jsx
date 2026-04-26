import React from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { Toggle } from "../ui/Toggle.jsx";
import { useT } from "../../i18n/useT.js";

export function ToolSettings() {
  const { state, dispatch } = useAppContext();
  const t = useT();

  return (
    <div className="setting-group">
      <Toggle
        label={t("toolUse")}
        checked={state.toolsEnabled}
        onChange={(val) => dispatch({ type: ACTIONS.SET_TOOLS_ENABLED, payload: val })}
      />
      {state.toolsEnabled && (
        <p className="hint">{t("toolUseHint")}</p>
      )}
    </div>
  );
}
