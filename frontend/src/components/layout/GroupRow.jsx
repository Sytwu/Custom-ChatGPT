import React, { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { ColorPicker } from "../chat/ColorPicker.jsx";

/**
 * Renders a group header row in the sidebar.
 * Children are the ConversationItems that belong to this group.
 */
export function GroupRow({ group, children }) {
  const { dispatch } = useAppContext();
  const [hovering, setHovering] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [editName, setEditName] = useState(group.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef(null);

  const { setNodeRef, isOver } = useDroppable({ id: `group-${group.id}` });

  useEffect(() => {
    if (renaming) {
      setEditName(group.name);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming, group.name]);

  function commitRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== group.name) {
      dispatch({ type: ACTIONS.RENAME_GROUP, payload: { id: group.id, name: trimmed } });
    }
    setRenaming(false);
  }

  function handleRenameKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); commitRename(); }
    if (e.key === "Escape") { setRenaming(false); }
  }

  function handleDelete() {
    dispatch({ type: ACTIONS.DELETE_GROUP, payload: group.id });
  }

  function handleToggleCollapse(e) {
    e.stopPropagation();
    dispatch({ type: ACTIONS.TOGGLE_GROUP_COLLAPSED, payload: group.id });
  }

  function handleToggleRag(e) {
    e.stopPropagation();
    dispatch({ type: ACTIONS.TOGGLE_GROUP_RAG, payload: group.id });
  }

  const borderColor = group.color ?? "transparent";

  if (confirmDelete) {
    return (
      <div className="group-row group-confirm">
        <span className="conv-item-confirm-text">Delete group &ldquo;{group.name}&rdquo;?</span>
        <div className="conv-item-confirm-btns">
          <button className="conv-confirm-yes" onClick={handleDelete}>Delete</button>
          <button className="conv-confirm-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="group-wrapper" ref={setNodeRef}>
      <div
        className={`group-row-header${isOver ? " drag-over" : ""}`}
        style={{ borderLeft: `4px solid ${borderColor}` }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <button
          className="group-collapse-btn"
          onClick={handleToggleCollapse}
          title={group.collapsed ? "Expand" : "Collapse"}
        >
          {group.collapsed ? "▶" : "▼"}
        </button>

        {renaming ? (
          <input
            ref={inputRef}
            className="conv-rename-input group-rename-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
          />
        ) : (
          <span className="group-name" onDoubleClick={() => setRenaming(true)}>
            📂 {group.name}
          </span>
        )}

        {group.ragEnabled && (
          <span className="rag-badge" title="Group RAG enabled">RAG</span>
        )}

        {hovering && !renaming && (
          <div className="group-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="conv-action-btn"
              title="Group colour"
              onClick={() => setShowColorPicker((v) => !v)}
            >🎨</button>
            <button
              className="conv-action-btn"
              title={group.ragEnabled ? "Disable group RAG" : "Enable group RAG"}
              onClick={handleToggleRag}
            >🔗</button>
            <button
              className="conv-action-btn"
              title="Rename group"
              onClick={() => setRenaming(true)}
            >✏️</button>
            <button
              className="conv-action-btn"
              title="Delete group"
              onClick={() => setConfirmDelete(true)}
            >🗑️</button>
          </div>
        )}

        {showColorPicker && (
          <div className="color-picker-popover">
            <ColorPicker
              value={group.color}
              onChange={(hex) =>
                dispatch({ type: ACTIONS.SET_GROUP_COLOR, payload: { id: group.id, color: hex } })
              }
              onClose={() => setShowColorPicker(false)}
            />
          </div>
        )}
      </div>

      {!group.collapsed && (
        <div className="group-children">
          {children}
        </div>
      )}
    </div>
  );
}
