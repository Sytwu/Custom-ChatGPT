import { ACTIONS } from "./actions.js";
import { DEFAULT_MODEL } from "../constants/models.js";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function makeConversation(model) {
  return {
    id: makeId(),
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    model,
    color: null,
    groupId: null,
  };
}

function makeGroup(name, color = null) {
  return {
    id: makeId(),
    name,
    color,
    collapsed: false,
    ragEnabled: false,
    createdAt: Date.now(),
  };
}

export const initialState = {
  // API Keys
  groqApiKey: "",
  nvidiaApiKey: "",

  // Settings
  model: DEFAULT_MODEL,
  systemPrompt: "",
  temperature: 0.7,
  maxTokens: 1024,
  memoryEnabled: true,
  memoryCutoff: 10,
  theme: "dark",
  language: "zh-TW",

  // Multi-conversation
  conversations: [],
  activeConversationId: null,
  groups: [],

  // Streaming
  isStreaming: false,
  streamingContent: "",

  // UI
  error: null,
};

/** Returns messages of the currently active conversation */
export function getActiveMessages(state) {
  const conv = state.conversations.find((c) => c.id === state.activeConversationId);
  return conv?.messages ?? [];
}

/**
 * Build the content to send to the LLM API.
 * For user messages with an image attachment, returns OpenAI vision array format.
 * For user messages with a text attachment, appends the file text block.
 */
export function apiContent(msg) {
  if (msg.role === "user" && msg.attachmentImageData) {
    const parts = [];
    if (msg.content) parts.push({ type: "text", text: msg.content });
    parts.push({ type: "image_url", image_url: { url: msg.attachmentImageData } });
    return parts;
  }
  if (msg.role === "user" && msg.attachmentText) {
    return `${msg.content}\n\n--- 附件：${msg.attachmentName} ---\n${msg.attachmentText}\n---`;
  }
  return msg.content;
}

function updateActiveMessages(state, updater) {
  return {
    ...state,
    conversations: state.conversations.map((c) =>
      c.id === state.activeConversationId
        ? { ...c, messages: updater(c.messages) }
        : c
    ),
  };
}

export function reducer(state, action) {
  switch (action.type) {
    // ── Settings ────────────────────────────────────────────────────
    case ACTIONS.SET_MODEL:
      return { ...state, model: action.payload };

    case ACTIONS.SET_SYSTEM_PROMPT:
      return { ...state, systemPrompt: action.payload };

    case ACTIONS.SET_TEMPERATURE:
      return { ...state, temperature: action.payload };

    case ACTIONS.SET_MAX_TOKENS:
      return { ...state, maxTokens: action.payload };

    case ACTIONS.TOGGLE_MEMORY:
      return { ...state, memoryEnabled: !state.memoryEnabled };

    case ACTIONS.SET_CUTOFF:
      return { ...state, memoryCutoff: action.payload };

    // ── API Keys ─────────────────────────────────────────────────────
    case ACTIONS.SET_GROQ_KEY:
      return { ...state, groqApiKey: action.payload };

    case ACTIONS.SET_NVIDIA_KEY:
      return { ...state, nvidiaApiKey: action.payload };

    // ── Conversations ────────────────────────────────────────────────
    case ACTIONS.NEW_CONVERSATION: {
      const conv = makeConversation(state.model);
      return {
        ...state,
        conversations: [conv, ...state.conversations],
        activeConversationId: conv.id,
        isStreaming: false,
        streamingContent: "",
        error: null,
      };
    }

    case ACTIONS.SWITCH_CONVERSATION:
      return {
        ...state,
        activeConversationId: action.payload,
        isStreaming: false,
        streamingContent: "",
        error: null,
      };

    case ACTIONS.SET_TITLE: {
      // Don't overwrite a title the user has manually set
      const target = state.conversations.find((c) => c.id === state.activeConversationId);
      if (target?.titleLocked) return state;
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId ? { ...c, title: action.payload } : c
        ),
      };
    }

    case ACTIONS.DELETE_CONVERSATION: {
      const remaining = state.conversations.filter((c) => c.id !== action.payload);
      if (remaining.length === 0) {
        const fresh = makeConversation(state.model);
        return { ...state, conversations: [fresh], activeConversationId: fresh.id };
      }
      const newActive =
        state.activeConversationId === action.payload
          ? remaining[0].id
          : state.activeConversationId;
      return { ...state, conversations: remaining, activeConversationId: newActive };
    }

    case ACTIONS.RENAME_CONVERSATION:
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload.id
            ? { ...c, title: action.payload.title, titleLocked: true }
            : c
        ),
      };

    // ── Messaging ────────────────────────────────────────────────────
    // payload: { content, attachmentName?, attachmentText?, attachmentImageData? }
    case ACTIONS.ADD_USER_MESSAGE:
      return updateActiveMessages(state, (msgs) => [
        ...msgs,
        {
          id: makeId(),
          role: "user",
          content: action.payload.content,
          attachmentName: action.payload.attachmentName ?? null,
          attachmentText: action.payload.attachmentText ?? null,
          attachmentImageData: action.payload.attachmentImageData ?? null,
          timestamp: Date.now(),
        },
      ]);

    case ACTIONS.START_STREAM:
      return { ...state, isStreaming: true, streamingContent: "", error: null };

    case ACTIONS.APPEND_TOKEN:
      return { ...state, streamingContent: state.streamingContent + action.payload };

    case ACTIONS.FINISH_STREAM: {
      if (!state.streamingContent) return { ...state, isStreaming: false };
      const content = state.streamingContent;
      return {
        ...updateActiveMessages(state, (msgs) => [
          ...msgs,
          { id: makeId(), role: "assistant", content, timestamp: Date.now() },
        ]),
        isStreaming: false,
        streamingContent: "",
      };
    }

    case ACTIONS.STREAM_ERROR:
      return { ...state, isStreaming: false, streamingContent: "", error: action.payload };

    // ── App lifecycle ─────────────────────────────────────────────────
    case ACTIONS.LOAD_STATE: {
      const p = action.payload;
      const conversations = p.conversations?.length > 0
        ? p.conversations
        : [makeConversation(p.model ?? DEFAULT_MODEL)];
      const activeId = conversations.some((c) => c.id === p.activeConversationId)
        ? p.activeConversationId
        : conversations[0].id;
      return {
        ...state,
        groqApiKey: p.groqApiKey ?? "",
        nvidiaApiKey: p.nvidiaApiKey ?? "",
        model: p.model ?? state.model,
        systemPrompt: p.systemPrompt ?? state.systemPrompt,
        temperature: p.temperature ?? state.temperature,
        maxTokens: p.maxTokens ?? state.maxTokens,
        memoryEnabled: p.memoryEnabled ?? state.memoryEnabled,
        memoryCutoff: p.memoryCutoff ?? state.memoryCutoff,
        theme: p.theme ?? state.theme,
        language: p.language ?? state.language,
        conversations,
        activeConversationId: activeId,
        groups: p.groups ?? [],
      };
    }

    // ── Conversation colour ───────────────────────────────────────────
    case ACTIONS.SET_CONVERSATION_COLOR:
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload.id ? { ...c, color: action.payload.color } : c
        ),
      };

    // ── Groups ────────────────────────────────────────────────────────
    case ACTIONS.CREATE_GROUP: {
      const group = makeGroup(action.payload.name, action.payload.color ?? null);
      return { ...state, groups: [...state.groups, group] };
    }

    case ACTIONS.RENAME_GROUP:
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.id ? { ...g, name: action.payload.name } : g
        ),
      };

    case ACTIONS.SET_GROUP_COLOR:
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload.id ? { ...g, color: action.payload.color } : g
        ),
      };

    case ACTIONS.DELETE_GROUP:
      return {
        ...state,
        groups: state.groups.filter((g) => g.id !== action.payload),
        conversations: state.conversations.map((c) =>
          c.groupId === action.payload ? { ...c, groupId: null } : c
        ),
      };

    case ACTIONS.TOGGLE_GROUP_COLLAPSED:
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload ? { ...g, collapsed: !g.collapsed } : g
        ),
      };

    case ACTIONS.MOVE_CONVERSATION_TO_GROUP:
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload.convId
            ? { ...c, groupId: action.payload.groupId ?? null }
            : c
        ),
      };

    case ACTIONS.TOGGLE_GROUP_RAG:
      return {
        ...state,
        groups: state.groups.map((g) =>
          g.id === action.payload ? { ...g, ragEnabled: !g.ragEnabled } : g
        ),
      };

    // ── UI / Preferences ──────────────────────────────────────────────
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case ACTIONS.SET_THEME:
      return { ...state, theme: action.payload };

    case ACTIONS.SET_LANGUAGE:
      return { ...state, language: action.payload };

    default:
      return state;
  }
}
