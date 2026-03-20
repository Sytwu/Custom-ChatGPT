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

  // Multi-conversation
  conversations: [],
  activeConversationId: null,

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

    case ACTIONS.SET_TITLE:
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === state.activeConversationId ? { ...c, title: action.payload } : c
        ),
      };

    // ── Messaging ────────────────────────────────────────────────────
    case ACTIONS.ADD_USER_MESSAGE:
      return updateActiveMessages(state, (msgs) => [
        ...msgs,
        { id: makeId(), role: "user", content: action.payload, timestamp: Date.now() },
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
        conversations,
        activeConversationId: activeId,
      };
    }

    // ── UI ────────────────────────────────────────────────────────────
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
}
