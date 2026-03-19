import Groq from "groq-sdk";
import config from "../config.js";

const client = new Groq({ apiKey: config.groqApiKey });

/**
 * Returns an async iterable of content delta strings.
 * @param {object[]} messages - Full messages array including system message
 * @param {string} model
 * @param {number} temperature
 * @param {number} maxTokens
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
