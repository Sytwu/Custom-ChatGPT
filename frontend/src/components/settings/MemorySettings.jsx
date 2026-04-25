import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useMemory } from "../../hooks/useMemory.js";
import { useT } from "../../i18n/useT.js";

export function MemorySettings() {
  const { isLoggedIn } = useAuth();
  const { fetchMemories, addMemory, deleteMemory } = useMemory();
  const t = useT();

  const [memories, setMemories] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    const data = await fetchMemories().catch(() => []);
    setMemories(data);
  }, [isLoggedIn, fetchMemories]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    window.addEventListener("memory-updated", load);
    return () => window.removeEventListener("memory-updated", load);
  }, [load]);

  if (!isLoggedIn) {
    return (
      <div className="memory-settings-section">
        <p className="memory-login-hint">{t("loginRequired")}</p>
      </div>
    );
  }

  async function handleAdd() {
    const content = newContent.trim();
    if (!content) return;
    setAdding(true);
    setError(null);
    try {
      const entry = await addMemory(content);
      setMemories((prev) => [...prev, entry]);
      setNewContent("");
    } catch (err) {
      setError(err.message || t("memoryError"));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteMemory(id);
    } catch {
      load();
    }
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="memory-settings-section">
      <div className="memory-add-row">
        <input
          className="memory-input"
          placeholder={t("memoryPlaceholder")}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
          disabled={adding}
        />
        <button className="memory-add-btn" onClick={handleAdd} disabled={adding || !newContent.trim()}>
          {t("addMemory")}
        </button>
      </div>
      {error && <p className="memory-error">{error}</p>}

      {memories.length === 0 ? (
        <p className="memory-empty">{t("noMemories")}</p>
      ) : (
        <ul className="memory-list">
          {memories.map((m) => (
            <li key={m.id} className="memory-item">
              <div className="memory-item-content">{m.content}</div>
              <div className="memory-item-meta">
                <span className={`memory-source-badge ${m.source}`}>
                  {m.source === "manual" ? t("sourceManual") : t("sourceAuto")}
                </span>
                <span className="memory-date">{formatDate(m.createdAt)}</span>
              </div>
              <button
                className="memory-delete-btn"
                title={t("deleteMemory")}
                onClick={() => handleDelete(m.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
