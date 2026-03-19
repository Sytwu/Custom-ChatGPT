import OpenAI from "openai";
import config from "../config.js";

const client = new OpenAI({
  apiKey: config.nvidiaApiKey,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

/**
 * Returns an async iterable of content delta strings.
 * NVIDIA NIM uses the OpenAI-compatible API.
 */
export async function streamChat(messages, model, temperature, maxTokens) {
  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });
  return stream;
}
