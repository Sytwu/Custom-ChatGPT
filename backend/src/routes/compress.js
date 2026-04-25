import { Router } from "express";
import { completeChat } from "../services/groq.js";
import config from "../config.js";
import { completeChat as llmComplete } from "../services/llm.js";

const router = Router();

const SYSTEM_PROMPT = `你是對話摘要助理。請將以下對話記錄壓縮成一段精簡的繁體中文摘要，保留所有關鍵資訊、決策與結論。
直接輸出摘要文字，不要加任何說明或標題。`;

router.post("/", async (req, res) => {
  const { messages, model, apiKey } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages is required" });
  }

  // Flatten conversation into a single user message to guarantee valid [system, user] order
  const conversationText = messages
    .map((m) => {
      const role = m.role === "user" ? "User" : "Assistant";
      const content = typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content.filter((p) => p.type === "text").map((p) => p.text ?? "").join(" ")
          : String(m.content);
      return `${role}: ${content}`;
    })
    .join("\n\n");

  try {
    let summary;
    if (config.groqApiKey) {
      summary = await completeChat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: conversationText },
        ],
        "llama-3.1-8b-instant",
        0.3,
        1024,
        null
      );
    } else {
      summary = await llmComplete(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: conversationText },
        ],
        model || "llama-3.1-8b-instant",
        0.3,
        1024,
        apiKey
      );
    }
    console.log("[compress] summary length:", summary?.length, "first 100:", summary?.slice(0, 100));
    const trimmed = summary?.trim();
    if (!trimmed) return res.status(500).json({ error: "empty_summary" });
    res.json({ summary: trimmed });
  } catch (err) {
    console.error("[compress] error:", err.message, err.status ?? "");
    res.status(500).json({ error: "compress_failed" });
  }
});

export default router;
