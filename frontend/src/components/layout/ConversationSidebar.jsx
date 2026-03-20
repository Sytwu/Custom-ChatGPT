import React, { useState, useRef, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useAppContext } from "../../hooks/useAppContext.js";
import { ACTIONS } from "../../context/actions.js";
import { ColorPicker } from "../chat/ColorPicker.jsx";
import { GroupRow } from "./GroupRow.jsx";

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ConversationItem({ conv, isActive, onSwitch, isStreaming }) {
  const { dispatch } = useAppContext();
  const [hovering, setHovering] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);
  const inputRef = useRef(null);

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: conv.id,
  });

  useEffect(() => {
    if (renaming) {
      setEditTitle(conv.title);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming, conv.title]);

  function commitRename() {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conv.title) {
      dispatch({ type: ACTIONS.RENAME_CONVERSATION, payload: { id: conv.id, title: trimmed } });
    }
    setRenaming(false);
  }

  function handleRenameKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); commitRename(); }
    if (e.key === "Escape") { setRenaming(false); }
  }

  function handleDelete() {
    dispatch({ type: ACTIONS.DELETE_CONVERSATION, payload: conv.id });
    setConfirmDelete(false);
  }

  const borderColor = conv.color ?? "transparent";
  const style = {
    borderLeft: `4px solid ${borderColor}`,
    opacity: isDragging ? 0.4 : 1,
  };

  if (confirmDelete) {
    return (
      <div
        className={`conv-item conv-item-confirm ${isActive ? "active" : ""}`}
        style={style}
      >
        <span className="conv-item-confirm-text">Delete this chat?</span>
        <div className="conv-item-confirm-btns">
          <button className="conv-confirm-yes" onClick={handleDelete}>Delete</button>
          <button className="conv-confirm-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  if (renaming) {
    return (
      <div className={`conv-item ${isActive ? "active" : ""}`} style={style}>
        <input
          ref={inputRef}
          className="conv-rename-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleRenameKeyDown}
        />
      </div>
    );
  }

  return (
    <div
      ref={setDragRef}
      {...attributes}
      {...listeners}
      className={`conv-item ${isActive ? "active" : ""}`}
      style={style}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setShowColorPicker(false); }}
      onClick={() => onSwitch(conv.id)}
    >
      <div className="conv-item-main">
        <span className="conv-item-title">{conv.title}</span>
        <span className="conv-item-date">{formatDate(conv.createdAt)}</span>
      </div>
      {hovering && !isStreaming && (
        <div className="conv-item-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="conv-action-btn"
            title="Colour"
            onClick={() => setShowColorPicker((v) => !v)}
          >🎨</button>
          <button
            className="conv-action-btn"
            title="Rename"
            onClick={() => setRenaming(true)}
          >✏️</button>
          <button
            className="conv-action-btn"
            title="Delete"
            onClick={() => setConfirmDelete(true)}
          >🗑️</button>
        </div>
      )}
      {showColorPicker && (
        <div className="color-picker-popover" onClick={(e) => e.stopPropagation()}>
          <ColorPicker
            value={conv.color}
            onChange={(hex) =>
              dispatch({ type: ACTIONS.SET_CONVERSATION_COLOR, payload: { id: conv.id, color: hex } })
            }
            onClose={() => setShowColorPicker(false)}
          />
        </div>
      )}
    </div>
  );
}

/** Drop zone for conversations with no group (root level) */
function RootDropZone({ children }) {
  const { setNodeRef, isOver } = useDroppable({ id: "root" });
  return (
    <div
      ref={setNodeRef}
      className={`root-drop-zone${isOver ? " drag-over" : ""}`}
    >
      {children}
    </div>
  );
}

export function ConversationSidebar() {
  const { state, dispatch } = useAppContext();
  const [collapsed, setCollapsed] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const newGroupInputRef = useRef(null);

  useEffect(() => {
    if (creatingGroup) {
      setNewGroupName("");
      newGroupInputRef.current?.focus();
    }
  }, [creatingGroup]);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 6 },
  }));

  function handleDragEnd({ active, over }) {
    if (!over) return;
    const convId = active.id;
    if (over.id === "root") {
      dispatch({ type: ACTIONS.MOVE_CONVERSATION_TO_GROUP, payload: { convId, groupId: null } });
    } else if (over.id.startsWith("group-")) {
      const groupId = over.id.slice(6);
      dispatch({ type: ACTIONS.MOVE_CONVERSATION_TO_GROUP, payload: { convId, groupId } });
    }
  }

  function commitCreateGroup() {
    const name = newGroupName.trim() || "New Group";
    dispatch({ type: ACTIONS.CREATE_GROUP, payload: { name } });
    setCreatingGroup(false);
  }

  function handleGroupInputKeyDown(e) {
    if (e.key === "Enter") { e.preventDefault(); commitCreateGroup(); }
    if (e.key === "Escape") { setCreatingGroup(false); }
  }

  const sorted = [...state.conversations].sort((a, b) => b.createdAt - a.createdAt);
  const ungrouped = sorted.filter((c) => !c.groupId);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <aside className={`sidebar conv-sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          {!collapsed && <h2>Chats</h2>}
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand chats" : "Collapse chats"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {!collapsed && (
          <div className="sidebar-content conv-sidebar-content">
            <div className="sidebar-top-btns">
              <button
                className="new-chat-btn"
                onClick={() => dispatch({ type: ACTIONS.NEW_CONVERSATION })}
                disabled={state.isStreaming}
              >
                + New Chat
              </button>
              <button
                className="new-group-btn"
                onClick={() => setCreatingGroup((v) => !v)}
                title="New group"
              >
                📂
              </button>
            </div>

            {creatingGroup && (
              <div className="new-group-input-row">
                <input
                  ref={newGroupInputRef}
                  className="conv-rename-input"
                  placeholder="Group name…"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onBlur={commitCreateGroup}
                  onKeyDown={handleGroupInputKeyDown}
                />
              </div>
            )}

            <div className="conv-list">
              {/* Render groups */}
              {state.groups.map((group) => {
                const groupConvs = sorted.filter((c) => c.groupId === group.id);
                return (
                  <GroupRow key={group.id} group={group}>
                    {groupConvs.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conv={conv}
                        isActive={conv.id === state.activeConversationId}
                        isStreaming={state.isStreaming}
                        onSwitch={(id) =>
                          dispatch({ type: ACTIONS.SWITCH_CONVERSATION, payload: id })
                        }
                      />
                    ))}
                  </GroupRow>
                );
              })}

              {/* Ungrouped conversations at root */}
              <RootDropZone>
                {ungrouped.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conv={conv}
                    isActive={conv.id === state.activeConversationId}
                    isStreaming={state.isStreaming}
                    onSwitch={(id) =>
                      dispatch({ type: ACTIONS.SWITCH_CONVERSATION, payload: id })
                    }
                  />
                ))}
              </RootDropZone>
            </div>
          </div>
        )}
      </aside>
    </DndContext>
  );
}
