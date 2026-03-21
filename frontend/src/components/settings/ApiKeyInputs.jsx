import React, { useState } from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { useT } from "../../i18n/useT.js";

function ApiKeyField({ label, value, onChange }) {
  const t = useT();
  const [show, setShow] = useState(false);
  return (
    <div className="setting-row">
      <label>{label}</label>
      <div className="api-key-row">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("apiKeyPlaceholder")}
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className="eye-btn"
          type="button"
          onClick={() => setShow((s) => !s)}
          title={show ? t("hideKey") : t("showKey")}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

export function ApiKeyInputs() {
  const { state, dispatch } = useAppContext();
  const t = useT();
  return (
    <div className="setting-group">
      <ApiKeyField
        label={t("groqApiKey")}
        value={state.groqApiKey}
        onChange={(val) => dispatch({ type: ACTIONS.SET_GROQ_KEY, payload: val })}
      />
      <ApiKeyField
        label={t("nvidiaApiKey")}
        value={state.nvidiaApiKey}
        onChange={(val) => dispatch({ type: ACTIONS.SET_NVIDIA_KEY, payload: val })}
      />
    </div>
  );
}
