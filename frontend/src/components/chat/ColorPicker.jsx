import React from "react";
import { PALETTE } from "../../constants/colors.js";

/**
 * A small predefined colour palette popover.
 * props:
 *   value   – current hex string or null
 *   onChange – (hex | null) => void
 *   onClose  – () => void  (called when user clicks outside or selects a colour)
 */
export function ColorPicker({ value, onChange, onClose }) {
  function handleSelect(hex) {
    onChange(hex);
    onClose();
  }

  return (
    <div className="color-picker" onClick={(e) => e.stopPropagation()}>
      {PALETTE.map((entry) => (
        <button
          key={entry.id}
          className={`color-swatch${value === entry.hex ? " selected" : ""}`}
          title={entry.label}
          onClick={() => handleSelect(entry.hex)}
          style={entry.hex ? { background: entry.hex } : undefined}
        >
          {!entry.hex && <span className="color-none-icon">⊘</span>}
        </button>
      ))}
    </div>
  );
}
