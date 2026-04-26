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
import { useT } from "../../i18n/useT.js";

function formatDate(ts, t) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return t("today");
  if (diffDays === 1) return t("yesterday");
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const API_BASE = import.meta.env.VITE_API_URL || "";

function ConversationItem({ conv, isActive, onSwitch, isStreaming }) {
  const { dispatch, state } = useAppContext();
  const t = useT();
  const [hovering, setHovering] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);
  const [compressing, setCompressing] = useState(false);
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

  async function handleCompress() {
    if (!window.confirm(t("compressConfirm"))) return;
    setCompressing(true);
    try {
      const messages = conv.messages.map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : String(m.content),
      }));
      const res = await fetch(`${API_BASE}/api/compress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, model: state.model, apiKey: state.groqApiKey }),
      });
      if (!res.ok) throw new Error("failed");
      const { summary } = await res.json();
      if (!summary?.trim()) throw new Error("empty");
      dispatch({ type: ACTIONS.COMPRESS_CONVERSATION, payload: { id: conv.id, summary } });
    } catch {
      alert(t("compressFailed"));
    } finally {
      setCompressing(false);
    }
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
        <span className="conv-item-confirm-text">{t("deleteThisChat")}</span>
        <div className="conv-item-confirm-btns">
          <button className="conv-confirm-yes" onClick={handleDelete}>{t("delete")}</button>
          <button className="conv-confirm-no" onClick={() => setConfirmDelete(false)}>{t("cancel")}</button>
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
        <span className="conv-item-title">
          {conv.discordMode && <span className="discord-badge" title={t("discordModeBeta")}># </span>}
          {conv.title}
        </span>
        <span className="conv-item-date">{formatDate(conv.createdAt, t)}</span>
      </div>
      {hovering && !isStreaming && (
        <div className="conv-item-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="conv-action-btn"
            title={t("colour")}
            onClick={() => setShowColorPicker((v) => !v)}
          >🎨</button>
          <button
            className="conv-action-btn"
            title={t("rename")}
            onClick={() => setRenaming(true)}
          >✏️</button>
          <button
            className="conv-action-btn"
            title={t("compressConv")}
            onClick={handleCompress}
            disabled={compressing || conv.messages.length === 0}
          >{compressing ? "⏳" : "⚡"}</button>
          <button
            className="conv-action-btn"
            title={t("deleteConv")}
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
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const newGroupInputRef = useRef(null);
  const [showNewChatPanel, setShowNewChatPanel] = useState(false);
  const [newChatDiscordMode, setNewChatDiscordMode] = useState(false);

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
    const name = newGroupName.trim() || t("newGroup");
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
          {!collapsed && <h2>{t("chats")}</h2>}
          <button
            className="collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? t("expandChats") : t("collapseChats")}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>

        {!collapsed && (
          <div className="sidebar-content conv-sidebar-content">
            <div className="sidebar-top-btns">
              <button
                className="new-chat-btn"
                onClick={() => { setShowNewChatPanel((v) => !v); setNewChatDiscordMode(false); }}
                disabled={state.isStreaming}
              >
                {t("newChat")}
              </button>
              <button
                className="new-group-btn"
                onClick={() => setCreatingGroup((v) => !v)}
                title={t("newGroup")}
              >
                📂
              </button>
            </div>

            {showNewChatPanel && (
              <div className="new-chat-panel">
                <label className="discord-mode-toggle-row">
                  <span className="discord-mode-label">
                    {t("discordModeBeta")}
                    <span className="discord-mode-desc">{t("discordModeDesc")}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={newChatDiscordMode}
                    onChange={(e) => setNewChatDiscordMode(e.target.checked)}
                  />
                </label>
                <div className="new-chat-panel-btns">
                  <button
                    className="conv-confirm-yes"
                    onClick={() => {
                      dispatch({ type: ACTIONS.NEW_CONVERSATION, payload: { discordMode: newChatDiscordMode } });
                      setShowNewChatPanel(false);
                      setNewChatDiscordMode(false);
                    }}
                  >
                    {t("createChat")}
                  </button>
                  <button className="conv-confirm-no" onClick={() => setShowNewChatPanel(false)}>
                    {t("cancel")}
                  </button>
                </div>
              </div>
            )}

            {creatingGroup && (
              <div className="new-group-input-row">
                <input
                  ref={newGroupInputRef}
                  className="conv-rename-input"
                  placeholder={t("groupNamePlaceholder")}
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onBlur={commitCreateGroup}
                  onKeyDown={handleGroupInputKeyDown}
                />
              </div>
            )}

            <div className="conv-list">
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
