import { useAppContext } from "./useAppContext.js";
import { ACTIONS } from "../context/actions.js";

/**
 * Trim the message history to respect the memoryCutoff.
 * If memory is disabled, only send the last user message.
 * If memory is enabled, keep the last N turns (N user + N assistant = 2N messages).
 */
function applyMemoryCutoff(messages, memoryEnabled, memoryCutoff) {
  if (!memoryEnabled) {
    // Send only the current (last) user message
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

    // 1. Add user message to state
    dispatch({ type: ACTIONS.ADD_USER_MESSAGE, payload: text.trim() });

    // 2. Build the trimmed message list for the request.
    //    Note: ADD_USER_MESSAGE hasn't updated state.messages yet (React batches),
    //    so we manually append the new message here.
    const allMessages = [
      ...state.messages,
      { role: "user", content: text.trim() },
    ];
    const trimmedMessages = applyMemoryCutoff(
      allMessages,
      state.memoryEnabled,
      state.memoryCutoff
    );

    // 3. Start streaming
    dispatch({ type: ACTIONS.START_STREAM });

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: state.model,
          systemPrompt: state.systemPrompt,
          messages: trimmedMessages,
          temperature: state.temperature,
          maxTokens: state.maxTokens,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        dispatch({ type: ACTIONS.STREAM_ERROR, payload: err.error ?? "Request failed" });
        return;
      }

      // 4. Read the SSE stream via fetch ReadableStream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep the last (possibly incomplete) line

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

      // Stream ended without [DONE] — finish anyway
      dispatch({ type: ACTIONS.FINISH_STREAM });
    } catch (err) {
      dispatch({ type: ACTIONS.STREAM_ERROR, payload: err.message ?? "Network error" });
    }
  }

  return { sendMessage };
}
