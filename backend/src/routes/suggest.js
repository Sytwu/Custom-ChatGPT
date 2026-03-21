import { Router } from "express";
import { completeChat } from "../services/llm.js";

const router = Router();

const SYSTEM_PROMPT = `You are a prompt engineering assistant. The user will give you an incomplete or rough message they are about to send to an AI assistant.
Your job is to:
1. Rewrite it as a clearer, more detailed, and more effective prompt (improved version).
2. Provide 4 prompt templates that could be useful alternatives (e.g. role-playing, step-by-step analysis, detailed spec, structured output).

Respond ONLY with valid JSON in this exact format (no markdown, no code block):
{"improved":"<rewritten prompt>","templates":[{"label":"<short label>","text":"<full prompt>"},{"label":"<short label>","text":"<full prompt>"},{"label":"<short label>","text":"<full prompt>"},{"label":"<short label>","text":"<full prompt>"}]}`;

router.post("/", async (req, res) => {
  const { text, model, apiKey } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }
  if (!model) {
    return res.status(400).json({ error: "model is required" });
  }

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text.trim() },
    ];

    const raw = await completeChat(messages, model, 0.7, 1024, apiKey || undefined);

    let parsed;
    try {
      // Strip any accidental markdown fences the model might add
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "Failed to parse suggestion response", raw });
    }

    res.json(parsed);
  } catch (err) {
    console.error("[suggest]", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
