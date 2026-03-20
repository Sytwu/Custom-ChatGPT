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
