import React from "react";
import { useT } from "../../i18n/useT.js";

export function FileAttachment({ attachment, onRemove }) {
  const t = useT();
  const isImage = !!attachment.imageData;

  return (
    <div className="attachment-bar">
      <div className="attachment-chip">
        {isImage ? (
          <img
            src={attachment.imageData}
            alt={attachment.name}
            className="attachment-image-thumb"
          />
        ) : (
          <span className="attachment-icon">📎</span>
        )}
        <span className="attachment-name">{attachment.name}</span>
        {attachment.truncated && (
          <span className="attachment-warn" title="File was truncated to 50,000 characters">
            ⚠️ {t("truncated")}
          </span>
        )}
        <button className="attachment-remove" onClick={onRemove} title="Remove attachment">
          ×
        </button>
      </div>
    </div>
  );
}
