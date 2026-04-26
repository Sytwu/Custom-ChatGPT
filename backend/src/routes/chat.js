import { Router } from "express";
import { streamChat, completeChatWithTools } from "../services/llm.js";
import { TOOLS_DEFINITION, executeTool } from "../services/tools/index.js";

const router = Router();
const MAX_TOOL_ROUNDS = 5;

router.post("/stream", async (req, res, next) => {
  const {
    model,
    systemPrompt,
    messages,
    temperature = 0.7,
    maxTokens = 1024,
    apiKey,
    toolsEnabled = false,
  } = req.body;

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
    let streamMessages = finalMessages;

    // Agentic tool-call loop (only when toolsEnabled and model supports tools)
    if (toolsEnabled) {
      let rounds = 0;
      while (rounds < MAX_TOOL_ROUNDS && !done) {
        let completion;
        try {
          completion = await completeChatWithTools(streamMessages, model, TOOLS_DEFINITION, apiKey);
        } catch (toolErr) {
          // Groq rejects malformed tool calls (tool_use_failed) — fall back to streaming without tools
          console.warn("[chat/stream] tool call rejected, falling back to streaming:", toolErr.message);
          break;
        }
        const choice = completion.choices?.[0];

        if (choice?.finish_reason !== "tool_calls") break;

        const toolCalls = choice.message.tool_calls ?? [];
        if (toolCalls.length === 0) break;

        // Add the assistant's tool-call message to the conversation
        streamMessages = [...streamMessages, choice.message];

        for (const tc of toolCalls) {
          if (done) break;
          const name = tc.function?.name ?? "unknown";
          let input = {};
          try { input = JSON.parse(tc.function?.arguments ?? "{}"); } catch { /* use empty input */ }

          res.write(`data: ${JSON.stringify({ toolCall: { name, input } })}\n\n`);

          const output = await executeTool(name, input);

          res.write(`data: ${JSON.stringify({ toolResult: { name, output } })}\n\n`);

          streamMessages = [
            ...streamMessages,
            { role: "tool", tool_call_id: tc.id, content: output },
          ];
        }

        rounds++;
      }

      if (rounds >= MAX_TOOL_ROUNDS && !done) {
        res.write(`data: ${JSON.stringify({ delta: "\n\n[工具呼叫已達上限，強制停止]" })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
    }

    // Final streaming response
    const stream = await streamChat(streamMessages, model, temperature, maxTokens, apiKey);

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
