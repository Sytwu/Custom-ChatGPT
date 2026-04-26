import { Router } from "express";
import { completeChat } from "../services/llm.js";

const router = Router();

const ROUTER_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

const ROUTING_SYSTEM_PROMPT = `You are a model router. Analyze the user's message and select the best Groq model.

Available models:
- llama-3.1-8b-instant: ONLY for extremely simple tasks — short greetings, yes/no answers, single-word questions, casual filler messages (e.g. "hi", "thanks", "ok").
- llama-3.3-70b-versatile: For ALL tasks that require thinking — analysis, writing, coding, math, comparison, explanation, planning, summarization, translation, debugging. When in doubt, use this.
- meta-llama/llama-4-scout-17b-16e-instruct: ONLY when the user explicitly mentions an image, photo, or visual content.
- meta-llama/llama-4-maverick-17b-128e-instruct: For complex tasks that involve BOTH images AND advanced reasoning.

Classification rule: If the message contains ANY of these signals, choose llama-3.3-70b-versatile:
- Chinese indicators: 分析、比較、解釋、評估、撰寫、建議、優缺點、如何、為什麼、實作、程式碼、設計、規劃、說明、總結、翻譯
- English indicators: analyze, compare, explain, evaluate, write, suggest, how to, why, implement, code, design, plan, summarize, translate, debug, review
- Message length > 30 words (indicates a complex, multi-part request)

Respond with JSON only (no markdown, no extra text):
{"modelId":"<model id>","reason":"<one short sentence>"}`;

router.post("/", async (req, res) => {
  const { message, apiKey } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    const raw = await completeChat(
      [
        { role: "system", content: ROUTING_SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      ROUTER_MODEL,
      0.1,
      128,
      apiKey,
    );

    let modelId = FALLBACK_MODEL;
    let reason = "default";

    try {
      const cleaned = raw.trim().replace(/^```json?\s*/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.modelId) {
        modelId = parsed.modelId;
        reason = parsed.reason ?? reason;
      }
    } catch {
      // JSON parse failed — use fallback
    }

    // Validate the model exists in our known list (simple prefix check)
    const knownPrefixes = ["llama-", "mixtral-", "gemma-", "meta-llama/", "deepseek-", "qwen-"];
    const isKnown = knownPrefixes.some((p) => modelId.startsWith(p));
    if (!isKnown) {
      modelId = FALLBACK_MODEL;
      reason = "fallback: unknown model suggested";
    }

    res.json({ modelId, reason });
  } catch (err) {
    res.status(400).json({ error: err.message ?? "Routing failed" });
  }
});

export default router;
