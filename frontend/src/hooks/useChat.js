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
   * @param {object|null} replyTo - { id, snippet, role } of the message being replied to, or null
   * @param {string} extraSystemPrompt - Additional system prompt text prepended before RAG/system prompt, or ""
   * @param {object|null} sticker - { url, description } when sending a sticker, or null
   */
  async function sendMessage(text, attachment = null, replyTo = null, extraSystemPrompt = "", sticker = null) {
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
        replyTo: replyTo ?? null,
        stickerUrl: sticker?.url ?? null,
        stickerDescription: sticker?.description ?? null,
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
    // If this is a reply, prepend the quoted snippet for the LLM
    const replyPrefix = replyTo ? `[Replying to: "${replyTo.snippet}"]\n\n` : "";
    const newMsg = {
      role: "user",
      content: replyPrefix + trimmedText,
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
      const discordPrefix = activeConv?.discordMode
        ? "You are in Discord chat mode. Keep your responses brief and conversational — ideally 1 to 3 sentences. Avoid lengthy explanations unless directly asked.\n\n"
        : "";
      const body = {
        model: state.model,
        systemPrompt: discordPrefix + extraSystemPrompt + ragPrefix + state.systemPrompt,
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

  /**
   * Sends multiple messages as separate user turns in one API call.
   * Each message becomes its own ADD_USER_MESSAGE entry (shown as individual bubbles).
   * The LLM receives all messages as separate user entries in the context.
   */
  /**
   * items: Array<{ content: string, stickerUrl?: string, stickerDescription?: string }>
   *   or legacy string[] (backwards compat)
   */
  async function sendMessageBatch(items, attachment = null, replyTo = null) {
    // Normalise: accept plain strings or item objects
    const filtered = items
      .map((x) => (typeof x === "string" ? { content: x } : x))
      .filter((x) => x.content?.trim() || x.stickerUrl);
    if (filtered.length === 0 && !attachment) return;
    if (state.isStreaming) return;

    // 1. Build API payload BEFORE dispatching (state hasn't updated yet)
    const activeMessages = getActiveMessages(state);
    const newApiMsgs = filtered.map((item, i) => ({
      role: "user",
      content: i === 0 && replyTo ? `[Replying to: "${replyTo.snippet}"]\n\n${item.content}` : item.content,
      attachmentText: i === filtered.length - 1 ? (attachment?.text ?? null) : null,
      attachmentImageData: i === filtered.length - 1 ? (attachment?.imageData ?? null) : null,
      attachmentName: i === filtered.length - 1 ? (attachment?.name ?? null) : null,
      reactions: {},
    }));
    const allMessages = [...activeMessages, ...newApiMsgs];
    const trimmedMessages = applyMemoryCutoff(allMessages, state.memoryEnabled, state.memoryCutoff);
    const apiMessages = trimmedMessages.map((msg) => ({
      role: msg.role,
      content: apiContent(msg),
    }));

    // 2. Auto-title from first message if conversation is new
    if (activeMessages.length === 0) {
      const titleSource = filtered[0]?.content || attachment?.name || "Untitled";
      const title = titleSource.slice(0, 35) + (titleSource.length > 35 ? "…" : "");
      dispatch({ type: ACTIONS.SET_TITLE, payload: title });
    }

    // 3. Dispatch each message as a real user message in state
    const now = Date.now();
    filtered.forEach((item, i) => {
      dispatch({
        type: ACTIONS.ADD_USER_MESSAGE,
        payload: {
          content: item.content,
          replyTo: i === 0 ? replyTo ?? null : null,
          attachmentName: i === filtered.length - 1 ? (attachment?.name ?? null) : null,
          attachmentText: i === filtered.length - 1 ? (attachment?.text ?? null) : null,
          attachmentImageData: i === filtered.length - 1 ? (attachment?.imageData ?? null) : null,
          stickerUrl: item.stickerUrl ?? null,
          stickerDescription: item.stickerDescription ?? null,
          timestamp: now + i,
        },
      });
    });

    // 4. RAG
    const activeConv = state.conversations.find((c) => c.id === state.activeConversationId);
    let ragPrefix = "";
    if (activeConv?.groupId) {
      const group = state.groups.find((g) => g.id === activeConv.groupId);
      if (group?.ragEnabled) {
        const siblings = state.conversations.filter(
          (c) => c.groupId === group.id && c.id !== state.activeConversationId
        );
        const ragApiKey = state.nvidiaApiKey || null;
        if (!ragApiKey) console.warn("[RAG] NVIDIA API key not set — skipping RAG");
        ragPrefix = await fetchRagContext(filtered[filtered.length - 1], siblings, ragApiKey);
      }
    }

    // 5. Stream
    dispatch({ type: ACTIONS.START_STREAM });
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const discordPrefix = activeConv?.discordMode
        ? "You are in Discord chat mode. Keep your responses brief and conversational — ideally 1 to 3 sentences. Avoid lengthy explanations unless directly asked.\n\n"
        : "";
      const apiKey = isNvidiaModel(state.model) ? state.nvidiaApiKey : state.groqApiKey;
      const body = {
        model: state.model,
        systemPrompt: discordPrefix + ragPrefix + state.systemPrompt,
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
          if (payload === "[DONE]") { dispatch({ type: ACTIONS.FINISH_STREAM }); return; }
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) { dispatch({ type: ACTIONS.STREAM_ERROR, payload: parsed.error }); return; }
            if (parsed.delta) dispatch({ type: ACTIONS.APPEND_TOKEN, payload: parsed.delta });
          } catch { /* ignore malformed SSE */ }
        }
      }
      dispatch({ type: ACTIONS.FINISH_STREAM });
    } catch (err) {
      if (err.name === "AbortError") dispatch({ type: ACTIONS.FINISH_STREAM });
      else dispatch({ type: ACTIONS.STREAM_ERROR, payload: err.message ?? "Network error" });
    }
  }

  /**
   * Sends a sticker directly (bypasses textarea, goes straight to API).
   */
  async function sendSticker(stickerUrl, stickerDescription, replyTo = null) {
    const content = `[sticker: ${stickerDescription}]`;
    return sendMessage(content, null, replyTo, "", { url: stickerUrl, description: stickerDescription });
  }

  return { sendMessage, sendMessageBatch, sendSticker, stopStream };
}
