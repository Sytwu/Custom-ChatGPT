import { Router } from "express";
import { streamChat } from "../services/llm.js";

const router = Router();

router.post("/stream", async (req, res, next) => {
  const { model, systemPrompt, messages, temperature = 0.7, maxTokens = 1024, apiKey } = req.body;

  if (!model) {
    return res.status(400).json({ error: "model is required" });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Some models (e.g. Gemma) don't support the system role —
  // prepend the system prompt to the first user message instead.
  const noSystemRole = model.startsWith("google/gemma");
  const cleanMessages = messages.map(({ role, content }) => ({ role, content }));

  const fullMessages = [];
  if (systemPrompt && systemPrompt.trim()) {
    if (noSystemRole) {
      // Inject system prompt as a prefix on the first user message
      const firstUser = cleanMessages.findIndex((m) => m.role === "user");
      if (firstUser !== -1) {
        const existing = cleanMessages[firstUser].content;
        // content may be a string or an array (vision format)
        if (Array.isArray(existing)) {
          cleanMessages[firstUser] = {
            role: "user",
            content: [{ type: "text", text: `[System: ${systemPrompt.trim()}]\n\n` }, ...existing],
          };
        } else {
          cleanMessages[firstUser] = {
            role: "user",
            content: `[System: ${systemPrompt.trim()}]\n\n${existing}`,
          };
        }
      }
    } else {
      fullMessages.push({ role: "system", content: systemPrompt.trim() });
    }
  }
  fullMessages.push(...cleanMessages);

  // Some models (e.g. Gemma) require strict user/assistant alternation.
  // Merge consecutive messages of the same role to satisfy this constraint.
  let finalMessages = fullMessages;
  if (noSystemRole) {
    finalMessages = [];
    for (const msg of fullMessages) {
      const prev = finalMessages[finalMessages.length - 1];
      if (prev && prev.role === msg.role) {
        const a = typeof prev.content === "string" ? prev.content : JSON.stringify(prev.content);
        const b = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
        finalMessages[finalMessages.length - 1] = { role: prev.role, content: `${a}\n\n${b}` };
      } else {
        finalMessages.push(msg);
      }
    }
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Clean up if the client disconnects mid-stream
  let done = false;
  res.on("close", () => {
    done = true;
  });

  try {
    const stream = await streamChat(finalMessages, model, temperature, maxTokens, apiKey);

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
