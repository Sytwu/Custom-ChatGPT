import React from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { useT } from "../../i18n/useT.js";

export function SystemPromptInput() {
  const { state, dispatch } = useAppContext();
  const t = useT();

  return (
    <div className="setting-row">
      <label htmlFor="system-prompt">{t("systemPrompt")}</label>
      <textarea
        id="system-prompt"
        rows={4}
        placeholder={t("systemPromptPlaceholder")}
        value={state.systemPrompt}
        onChange={(e) =>
          dispatch({ type: ACTIONS.SET_SYSTEM_PROMPT, payload: e.target.value })
        }
      />
    </div>
  );
}
