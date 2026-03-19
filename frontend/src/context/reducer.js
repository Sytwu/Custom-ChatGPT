import { ACTIONS } from "./actions.js";
import { DEFAULT_MODEL } from "../constants/models.js";

export const initialState = {
  // Settings
  model: DEFAULT_MODEL,
  systemPrompt: "",
  temperature: 0.7,
  maxTokens: 1024,
  memoryEnabled: true,
  memoryCutoff: 10, // keep last N turns (1 turn = 1 user msg + 1 assistant msg)

  // Conversation
  messages: [], // { id, role, content, timestamp }[]

  // Streaming
  isStreaming: false,
  streamingContent: "",

  // UI
  error: null,
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function reducer(state, action) {
  switch (action.type) {
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

    case ACTIONS.ADD_USER_MESSAGE:
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: makeId(),
            role: "user",
            content: action.payload,
            timestamp: Date.now(),
          },
        ],
        error: null,
      };

    case ACTIONS.CLEAR_MESSAGES:
      return {
        ...state,
        messages: [],
        streamingContent: "",
        isStreaming: false,
        error: null,
      };

    case ACTIONS.START_STREAM:
      return { ...state, isStreaming: true, streamingContent: "", error: null };

    case ACTIONS.APPEND_TOKEN:
      return { ...state, streamingContent: state.streamingContent + action.payload };

    case ACTIONS.FINISH_STREAM:
      if (!state.streamingContent) return { ...state, isStreaming: false };
      return {
        ...state,
        isStreaming: false,
        streamingContent: "",
        messages: [
          ...state.messages,
          {
            id: makeId(),
            role: "assistant",
            content: state.streamingContent,
            timestamp: Date.now(),
          },
        ],
      };

    case ACTIONS.STREAM_ERROR:
      return {
        ...state,
        isStreaming: false,
        streamingContent: "",
        error: action.payload,
      };

    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
}
