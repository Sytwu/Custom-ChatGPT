import { useAppContext } from "./useAppContext.js";
import { ACTIONS } from "../context/actions.js";
import { getActiveMessages } from "../context/reducer.js";

const NVIDIA_PREFIXES = [
  "nvidia/", "meta/", "mistralai/", "google/", "microsoft/",
  "deepseek-ai/", "qwen/", "moonshotai/",
];

function isNvidiaModel(modelId) {
  return NVIDIA_PREFIXES.some((prefix) => modelId.startsWith(prefix));
}

/**
 * Trim the message history to respect the memoryCutoff.
 * If memory is disabled, only send the last user message.
 * If memory is enabled, keep the last N turns (N user + N assistant = 2N messages).
 */
function applyMemoryCutoff(messages, memoryEnabled, memoryCutoff) {
  if (!memoryEnabled) {
    return [messages[messages.length - 1]];
  }
  const maxMessages = memoryCutoff * 2;
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
}

export function useChat() {
  const { state, dispatch } = useAppContext();

  async function sendMessage(text) {
    if (!text.trim() || state.isStreaming) return;

    const trimmedText = text.trim();

    // 1. Add user message to active conversation
    dispatch({ type: ACTIONS.ADD_USER_MESSAGE, payload: trimmedText });

    // 2. Auto-title: set title from first message if conversation is currently "New Chat"
    const activeMessages = getActiveMessages(state);
    if (activeMessages.length === 0) {
      const title = trimmedText.slice(0, 35) + (trimmedText.length > 35 ? "…" : "");
      dispatch({ type: ACTIONS.SET_TITLE, payload: title });
    }

    // 3. Build the message list for the request.
    //    ADD_USER_MESSAGE hasn't updated state yet (React batches),
    //    so we manually append the new message here.
    const allMessages = [
      ...activeMessages,
      { role: "user", content: trimmedText },
    ];
    const trimmedMessages = applyMemoryCutoff(allMessages, state.memoryEnabled, state.memoryCutoff);

    // 4. Determine the right API key for the selected model
    const apiKey = isNvidiaModel(state.model) ? state.nvidiaApiKey : state.groqApiKey;

    // 5. Start streaming
    dispatch({ type: ACTIONS.START_STREAM });

    try {
      const body = {
        model: state.model,
        systemPrompt: state.systemPrompt,
        messages: trimmedMessages,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
      };
      if (apiKey) body.apiKey = apiKey;

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        dispatch({ type: ACTIONS.STREAM_ERROR, payload: err.error ?? "Request failed" });
        return;
      }

      // 6. Read the SSE stream via fetch ReadableStream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();

          if (payload === "[DONE]") {
            dispatch({ type: ACTIONS.FINISH_STREAM });
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) {
              dispatch({ type: ACTIONS.STREAM_ERROR, payload: parsed.error });
              return;
            }
            if (parsed.delta) {
              dispatch({ type: ACTIONS.APPEND_TOKEN, payload: parsed.delta });
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }

      dispatch({ type: ACTIONS.FINISH_STREAM });
    } catch (err) {
      dispatch({ type: ACTIONS.STREAM_ERROR, payload: err.message ?? "Network error" });
    }
  }

  return { sendMessage };
}
