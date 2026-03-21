import * as groqService from "./groq.js";
import * as nvidiaService from "./nvidia.js";

// Model IDs that belong to NVIDIA NIM (identified by vendor prefix)
const NVIDIA_PREFIXES = [
  "nvidia/", "meta/", "mistralai/", "google/", "microsoft/",
  "deepseek-ai/", "qwen/", "moonshotai/",
];

function isNvidiaModel(modelId) {
  return NVIDIA_PREFIXES.some((prefix) => modelId.startsWith(prefix));
}

/**
 * Dispatch a streaming chat request to the correct LLM provider.
 * Returns an async iterable (OpenAI-compatible stream).
 */
export async function streamChat(messages, model, temperature, maxTokens, apiKey) {
  if (isNvidiaModel(model)) {
    return nvidiaService.streamChat(messages, model, temperature, maxTokens, apiKey);
  }
  return groqService.streamChat(messages, model, temperature, maxTokens, apiKey);
}

/**
 * Dispatch a non-streaming chat request to the correct LLM provider.
 * Returns the response content string.
 */
export async function completeChat(messages, model, temperature, maxTokens, apiKey) {
  if (isNvidiaModel(model)) {
    return nvidiaService.completeChat(messages, model, temperature, maxTokens, apiKey);
  }
  return groqService.completeChat(messages, model, temperature, maxTokens, apiKey);
}
