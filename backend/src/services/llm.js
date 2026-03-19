import * as groqService from "./groq.js";
import * as nvidiaService from "./nvidia.js";

// Model IDs that belong to NVIDIA NIM (identified by vendor prefix)
const NVIDIA_PREFIXES = ["nvidia/", "meta/", "mistralai/", "google/", "microsoft/"];

function isNvidiaModel(modelId) {
  return NVIDIA_PREFIXES.some((prefix) => modelId.startsWith(prefix));
}

/**
 * Dispatch a streaming chat request to the correct LLM provider.
 * Returns an async iterable (OpenAI-compatible stream).
 */
export async function streamChat(messages, model, temperature, maxTokens) {
  if (isNvidiaModel(model)) {
    return nvidiaService.streamChat(messages, model, temperature, maxTokens);
  }
  return groqService.streamChat(messages, model, temperature, maxTokens);
}
