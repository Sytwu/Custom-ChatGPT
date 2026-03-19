import React from "react";

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle-label">
      <span>{label}</span>
      <div
        className={`toggle-track ${checked ? "toggle-on" : "toggle-off"}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => e.key === " " && onChange(!checked)}
      >
        <div className="toggle-thumb" />
      </div>
    </label>
  );
}
