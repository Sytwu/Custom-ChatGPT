import OpenAI from "openai";
import config from "../config.js";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

const defaultClient = config.nvidiaApiKey
  ? new OpenAI({ apiKey: config.nvidiaApiKey, baseURL: NVIDIA_BASE_URL })
  : null;

export async function streamChat(messages, model, temperature, maxTokens, apiKey) {
  const client = apiKey
    ? new OpenAI({ apiKey, baseURL: NVIDIA_BASE_URL })
    : defaultClient;
  if (!client) {
    throw new Error("No NVIDIA API key available. Please add your NVIDIA API key in Settings.");
  }
  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });
  return stream;
}

export async function completeChat(messages, model, temperature, maxTokens, apiKey) {
  const client = apiKey
    ? new OpenAI({ apiKey, baseURL: NVIDIA_BASE_URL })
    : defaultClient;
  if (!client) {
    throw new Error("No NVIDIA API key available. Please add your NVIDIA API key in Settings.");
  }
  const result = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  });
  return result.choices?.[0]?.message?.content ?? "";
}
