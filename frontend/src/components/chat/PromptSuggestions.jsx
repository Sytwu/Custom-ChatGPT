import React from "react";
import { useT } from "../../i18n/useT.js";

export function PromptSuggestions({ loading, suggestions, onApplyImproved, onApplyTemplate, onClose }) {
  const t = useT();

  return (
    <div className="prompt-suggestions">
      <div className="prompt-suggestions-header">
        <span className="prompt-suggestions-title">✨ {t("suggestBtn")}</span>
        <button className="prompt-suggestions-close" onClick={onClose}>×</button>
      </div>

      {loading && (
        <div className="prompt-suggestions-loading">{t("loadingSuggestions")}</div>
      )}

      {!loading && suggestions?.error && (
        <div className="prompt-suggestions-error">{t("suggestError")}</div>
      )}

      {!loading && suggestions && !suggestions.error && (
        <>
          {suggestions.improved && (
            <div className="prompt-suggest-section">
              <div className="prompt-suggest-label">{t("suggestImproved")}</div>
              <div className="prompt-suggest-improved-text">{suggestions.improved}</div>
              <button
                className="prompt-suggest-apply-btn"
                onClick={() => onApplyImproved(suggestions.improved)}
              >
                {t("applyImproved")}
              </button>
            </div>
          )}

          {suggestions.templates?.length > 0 && (
            <div className="prompt-suggest-section">
              <div className="prompt-suggest-label">{t("suggestTemplates")}</div>
              <div className="prompt-suggest-templates">
                {suggestions.templates.map((tmpl, i) => (
                  <button
                    key={i}
                    className="prompt-template-chip"
                    onClick={() => onApplyTemplate(tmpl.text)}
                    title={tmpl.text}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
