import { useRef } from "react";
import { useAppContext } from "./useAppContext.js";
import { ACTIONS } from "../context/actions.js";
import { getActiveMessages, apiContent } from "../context/reducer.js";
import { fetchRagContext } from "./useRag.js";

const NVIDIA_PREFIXES = [
  "nvidia/", "meta/", "mistralai/", "google/", "microsoft/",
  "deepseek-ai/", "qwen/", "moonshotai/",
];

function isNvidiaModel(modelId) {
  return NVIDIA_PREFIXES.some((prefix) => modelId.startsWith(prefix));
}

function applyMemoryCutoff(messages, memoryEnabled, memoryCutoff) {
  if (!memoryEnabled) {
    return [messages[messages.length - 1]];
  }
  const maxMessages = memoryCutoff * 2;
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
}

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export function useChat() {
  const { state, dispatch } = useAppContext();
  const abortControllerRef = useRef(null);

  function stopStream() {
    abortControllerRef.current?.abort();
  }

  /**
   * @param {string} text - The user's typed message (display text only)
   * @param {object|null} attachment - { name, text?, imageData? } from file extraction, or null
   */
  async function sendMessage(text, attachment = null) {
    const trimmedText = text.trim();
    if (!trimmedText && !attachment) return;
    if (state.isStreaming) return;

    // 1. Store message with display content + attachment metadata (no full text)
    dispatch({
      type: ACTIONS.ADD_USER_MESSAGE,
      payload: {
        content: trimmedText,
        attachmentName: attachment?.name ?? null,
        attachmentText: attachment?.text ?? null,
        attachmentImageData: attachment?.imageData ?? null,
      },
    });

    // 2. Auto-title from first message
    const activeMessages = getActiveMessages(state);
    if (activeMessages.length === 0) {
      const titleSource = trimmedText || attachment?.name || "Untitled";
      const title = titleSource.slice(0, 35) + (titleSource.length > 35 ? "…" : "");
      dispatch({ type: ACTIONS.SET_TITLE, payload: title });
    }

    // 3. Build API payload — expand attachment text/image into content for the LLM
    const newMsg = {
      role: "user",
      content: trimmedText,
      attachmentName: attachment?.name ?? null,
      attachmentText: attachment?.text ?? null,
      attachmentImageData: attachment?.imageData ?? null,
    };
    const allMessages = [...activeMessages, newMsg];
    const trimmedMessages = applyMemoryCutoff(allMessages, state.memoryEnabled, state.memoryCutoff);

    // Convert to plain {role, content} objects with attachment text expanded
    const apiMessages = trimmedMessages.map((msg) => ({
      role: msg.role,
      content: apiContent(msg),
    }));

    const apiKey = isNvidiaModel(state.model) ? state.nvidiaApiKey : state.groqApiKey;

    // RAG: if the active conversation is in a RAG-enabled group, fetch relevant context
    let ragPrefix = "";
    const activeConv = state.conversations.find((c) => c.id === state.activeConversationId);
    if (activeConv?.groupId) {
      const group = state.groups.find((g) => g.id === activeConv.groupId);
      if (group?.ragEnabled) {
        const siblings = state.conversations.filter(
          (c) => c.groupId === group.id && c.id !== state.activeConversationId
        );
        // RAG always uses NVIDIA embeddings key (falls back to server env if not set)
        const ragApiKey = state.nvidiaApiKey || null;
        if (!ragApiKey) {
          console.warn("[RAG] NVIDIA API key not set — skipping RAG (set it in Settings)");
        }
        ragPrefix = await fetchRagContext(trimmedText, siblings, ragApiKey);
      }
    }

    dispatch({ type: ACTIONS.START_STREAM });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const body = {
        model: state.model,
        systemPrompt: ragPrefix + state.systemPrompt,
        messages: apiMessages,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
      };
      if (apiKey) body.apiKey = apiKey;

      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        dispatch({ type: ACTIONS.STREAM_ERROR, payload: err.error ?? "Request failed" });
        return;
      }

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
      if (err.name === "AbortError") {
        dispatch({ type: ACTIONS.FINISH_STREAM });
      } else {
        dispatch({ type: ACTIONS.STREAM_ERROR, payload: err.message ?? "Network error" });
      }
    }
  }

  return { sendMessage, stopStream };
}
