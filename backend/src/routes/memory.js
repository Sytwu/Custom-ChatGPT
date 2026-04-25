import express from "express";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware } from "../middleware/auth.js";
import { getMemories, addMemoryEntry, deleteMemoryEntry } from "../services/memoryStore.js";
import { completeChat } from "../services/llm.js";
import { completeChat as groqComplete } from "../services/groq.js";
import config from "../config.js";

const router = express.Router();
const MEMORY_LIMIT = 50;

const EXTRACTION_SYSTEM_PROMPT = `你是記憶萃取助理。以下是使用者說的話（已排除 AI 回應）。從中萃取關於「使用者本人」的客觀事實。
不要回應、不要提問、只輸出 JSON 物件。

萃取範圍：姓名、職業、學校、專案、技術偏好、語言偏好、重要背景等。
排除：問題、假設、不確定的推測、與使用者個人無關的一般知識。

輸出格式（只輸出此 JSON 物件，不加任何說明）：
{"facts": [{"content": "使用者就讀台大資工系"}, {"content": "使用者名叫小明"}]}

若無值得記憶的事實，輸出：{"facts": []}`;

function buildExtractionPrompt(existingMemories) {
  if (!existingMemories || existingMemories.length === 0) return EXTRACTION_SYSTEM_PROMPT;
  const known = existingMemories.map((m) => `- ${m.content}`).join("\n");
  return `${EXTRACTION_SYSTEM_PROMPT}\n\n已知記憶（語義重複的不要再萃取）：\n${known}`;
}

// Normalize string for dedup comparison: lowercase + remove spaces/punctuation
function normalizeForDedup(s) {
  return s.toLowerCase().replace(/[\s\u3000\p{P}]/gu, "");
}

function isDuplicateMemory(newContent, existingMemories) {
  const norm = normalizeForDedup(newContent);
  return existingMemories.some((m) => {
    const existing = normalizeForDedup(m.content);
    return existing === norm || existing.includes(norm) || norm.includes(existing);
  });
}

// Flatten a message content value to plain text for extraction.
// vision arrays ([{type:"text",...},{type:"image_url",...}]) are stripped of images.
function toTextContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join(" ");
  }
  return String(content);
}

// GET /api/memory — list all memories
router.get("/", authMiddleware, async (req, res) => {
  try {
    const memories = await getMemories(req.user.userId);
    res.json(memories);
  } catch (err) {
    console.error("[memory/list]", err.message);
    res.status(500).json({ error: "Failed to load memories" });
  }
});

// POST /api/memory — add a manual memory
router.post("/", authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "content is required" });
  }

  try {
    const memories = await getMemories(req.user.userId);
    if (memories.length >= MEMORY_LIMIT) {
      return res.status(400).json({ error: "Memory limit reached (50). Please delete old memories first." });
    }

    const entry = {
      id: uuidv4(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      source: "manual",
    };
    await addMemoryEntry(req.user.userId, entry);
    res.status(201).json(entry);
  } catch (err) {
    console.error("[memory/add]", err.message);
    res.status(500).json({ error: "Failed to save memory" });
  }
});

// DELETE /api/memory/:id — delete a memory
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await deleteMemoryEntry(req.user.userId, req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error("[memory/delete]", err.message);
    res.status(500).json({ error: "Failed to delete memory" });
  }
});

// POST /api/memory/extract — extract facts from conversation via LLM
router.post("/extract", authMiddleware, async (req, res) => {
  try {
    const { messages, model, apiKey } = req.body;
    console.log(`[memory/extract] user=${req.user?.userId} msgs=${messages?.length} model=${model}`);
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.json({ extracted: [] });
    }

    const useGroqFallback = !!config.groqApiKey;

    // Only send user messages — assistant content must not influence extraction
    // (e.g. assistant saying "as a Python developer" would be wrongly attributed to the user)
    const userTexts = messages
      .filter((m) => m.role === "user")
      .map((m) => toTextContent(m.content))
      .filter(Boolean)
      .join("\n---\n");

    if (!userTexts.trim()) return res.json({ extracted: [] });

    // Fetch existing memories to prevent duplicate extraction
    const existingMemories = await getMemories(req.user.userId).catch(() => []);
    const systemPrompt = buildExtractionPrompt(existingMemories);

    const extractionMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userTexts },
    ];

    let rawResponse;
    try {
      if (useGroqFallback) {
        rawResponse = await groqComplete(
          extractionMessages,
          "llama-3.1-8b-instant",
          0.3,
          512,
          null,
          { type: "json_object" }
        );
      } else {
        rawResponse = await completeChat(
          extractionMessages,
          model || "llama-3.1-8b-instant",
          0.3,
          512,
          apiKey
        );
      }
    } catch (err) {
      console.error("[memory/extract] LLM call failed:", err.message);
      return res.status(500).json({ error: "llm_failed" });
    }

    // Model returned empty string — treat as no memories found
    if (!rawResponse || !rawResponse.trim()) return res.json({ extracted: [] });

    // Extract JSON array from response — model may prepend prose or wrap in code fences
    const arrayMatch = rawResponse.match(/\[[\s\S]*\]/);
    const cleaned = arrayMatch ? arrayMatch[0] : rawResponse.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    let parsed;
    try {
      const obj = JSON.parse(cleaned);
      // Expected: {"facts": [{content: "..."}, ...]}
      // Fallbacks: raw array, or single {content: "..."}
      if (Array.isArray(obj)) {
        parsed = obj;
      } else if (Array.isArray(obj?.facts)) {
        parsed = obj.facts;
      } else if (typeof obj?.content === "string") {
        parsed = [obj];
      } else {
        parsed = [];
      }
    } catch {
      console.error("[memory/extract] Parse failed, raw repr:", JSON.stringify(rawResponse?.slice(0, 300)));
      return res.status(500).json({ error: "parse_failed" });
    }

    if (parsed.length === 0) {
      return res.json({ extracted: [] });
    }

    const existing = await getMemories(req.user.userId);
    const available = MEMORY_LIMIT - existing.length;
    const toAdd = parsed.slice(0, available);

    const newEntries = toAdd
      .filter((item) => item.content && typeof item.content === "string")
      .filter((item) => !isDuplicateMemory(item.content.trim(), existing))
      .map((item) => ({
        id: uuidv4(),
        content: item.content.trim(),
        createdAt: new Date().toISOString(),
        source: "auto",
      }));

    await Promise.all(newEntries.map((entry) => addMemoryEntry(req.user.userId, entry)));
    res.json({ extracted: newEntries });
  } catch (err) {
    console.error("[memory/extract] Unhandled error:", err.message, err.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: "internal_error" });
    }
  }
});

export default router;
