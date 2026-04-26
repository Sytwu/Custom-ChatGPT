import * as groqService from "./groq.js";

export async function streamChat(messages, model, temperature, maxTokens, apiKey) {
  return groqService.streamChat(messages, model, temperature, maxTokens, apiKey);
}

export async function completeChat(messages, model, temperature, maxTokens, apiKey) {
  return groqService.completeChat(messages, model, temperature, maxTokens, apiKey);
}
