import Groq from "groq-sdk";
import config from "../config.js";

const defaultClient = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

export async function streamChat(messages, model, temperature, maxTokens, apiKey) {
  const client = apiKey ? new Groq({ apiKey }) : defaultClient;
  if (!client) {
    throw new Error("No Groq API key available. Please add your Groq API key in Settings.");
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

export async function completeChat(messages, model, temperature, maxTokens, apiKey, responseFormat) {
  const client = apiKey ? new Groq({ apiKey }) : defaultClient;
  if (!client) {
    throw new Error("No Groq API key available. Please add your Groq API key in Settings.");
  }
  const params = { model, messages, temperature, max_tokens: maxTokens, stream: false };
  if (responseFormat) params.response_format = responseFormat;
  const result = await client.chat.completions.create(params);
  return result.choices?.[0]?.message?.content ?? "";
}
