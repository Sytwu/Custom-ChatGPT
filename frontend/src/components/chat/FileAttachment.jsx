import React from "react";

export function FileAttachment({ attachment, onRemove }) {
  return (
    <div className="attachment-bar">
      <div className="attachment-chip">
        <span className="attachment-icon">📎</span>
        <span className="attachment-name">{attachment.name}</span>
        {attachment.truncated && (
          <span className="attachment-warn" title="File was truncated to 50,000 characters">
            ⚠️ truncated
          </span>
        )}
        <button className="attachment-remove" onClick={onRemove} title="Remove attachment">
          ×
        </button>
      </div>
    </div>
  );
}
