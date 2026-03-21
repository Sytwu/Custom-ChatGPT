import React from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { useT } from "../../i18n/useT.js";

export function MaxTokensInput() {
  const { state, dispatch } = useAppContext();
  const t = useT();

  return (
    <div className="setting-row">
      <label htmlFor="max-tokens">{t("maxTokens")}</label>
      <input
        id="max-tokens"
        type="number"
        min="64"
        max="32768"
        step="64"
        value={state.maxTokens}
        onChange={(e) =>
          dispatch({ type: ACTIONS.SET_MAX_TOKENS, payload: parseInt(e.target.value, 10) })
        }
      />
    </div>
  );
}
