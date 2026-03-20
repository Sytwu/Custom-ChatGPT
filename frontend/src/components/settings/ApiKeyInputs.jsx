import React, { useState } from "react";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";

function ApiKeyField({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <div className="setting-row">
      <label>{label}</label>
      <div className="api-key-row">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your API key here"
          spellCheck={false}
          autoComplete="off"
        />
        <button
          className="eye-btn"
          type="button"
          onClick={() => setShow((s) => !s)}
          title={show ? "Hide key" : "Show key"}
        >
          {show ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

export function ApiKeyInputs() {
  const { state, dispatch } = useAppContext();
  return (
    <div className="setting-group">
      <ApiKeyField
        label="Groq API Key"
        value={state.groqApiKey}
        onChange={(val) => dispatch({ type: ACTIONS.SET_GROQ_KEY, payload: val })}
      />
      <ApiKeyField
        label="NVIDIA API Key"
        value={state.nvidiaApiKey}
        onChange={(val) => dispatch({ type: ACTIONS.SET_NVIDIA_KEY, payload: val })}
      />
    </div>
  );
}
