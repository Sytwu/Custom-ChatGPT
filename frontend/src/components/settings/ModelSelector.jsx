import React, { useState, useEffect } from "react";
import { MODELS } from "../../constants/models.js";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { useT } from "../../i18n/useT.js";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function ModelSelector() {
  const { state, dispatch } = useAppContext();
  const t = useT();
  const [dynamicModels, setDynamicModels] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = {};
    if (state.groqApiKey) headers["x-api-key"] = state.groqApiKey;
    fetch(`${API_BASE}/api/models`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.models?.length) setDynamicModels(data.models);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [state.groqApiKey]);

  const groups = dynamicModels
    ? [{ group: "Groq", models: dynamicModels.map((m) => ({ id: m.id, label: m.displayName })) }]
    : MODELS;

  return (
    <div className="setting-row">
      <label htmlFor="model-select">{t("model")}</label>
      <select
        id="model-select"
        value={state.model}
        onChange={(e) => dispatch({ type: ACTIONS.SET_MODEL, payload: e.target.value })}
        disabled={state.isStreaming || loading}
      >
        {groups.map((group) => (
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
