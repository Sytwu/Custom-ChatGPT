import { Router } from "express";
import { streamChat } from "../services/llm.js";

const router = Router();

router.post("/stream", async (req, res, next) => {
  const { model, systemPrompt, messages, temperature = 0.7, maxTokens = 1024 } = req.body;

  if (!model) {
    return res.status(400).json({ error: "model is required" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Build the full message list: system prompt + conversation history
  const fullMessages = [];
  if (systemPrompt && systemPrompt.trim()) {
    fullMessages.push({ role: "system", content: systemPrompt.trim() });
  }
  fullMessages.push(...messages);

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Clean up if the client disconnects mid-stream
  let done = false;
  req.on("close", () => {
    done = true;
  });

  try {
    const stream = await streamChat(fullMessages, model, temperature, maxTokens);

    for await (const chunk of stream) {
      if (done) break;
      const delta = chunk.choices?.[0]?.delta?.content ?? "";
      if (delta) {
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    if (!done) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (err) {
    if (!done) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
    console.error("[chat/stream]", err.message);
  }
});

export default router;
