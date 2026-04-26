import React from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { Toggle } from "../ui/Toggle.jsx";
import { useT } from "../../i18n/useT.js";

export function RoutingSettings() {
  const { state, dispatch } = useAppContext();
  const t = useT();

  return (
    <div className="setting-group">
      <Toggle
        label={t("autoRouting")}
        checked={state.autoRouting}
        onChange={(val) => dispatch({ type: ACTIONS.SET_AUTO_ROUTING, payload: val })}
      />
      {state.autoRouting && (
        <p className="hint">{t("autoRoutingHint")}</p>
      )}
    </div>
  );
}
