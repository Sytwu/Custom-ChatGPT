import { Router } from "express";
import Groq from "groq-sdk";
import config from "../config.js";

const router = Router();

const FALLBACK_MODELS = [
  { id: "llama-3.3-70b-versatile", displayName: "Llama 3.3 70B" },
  { id: "llama-3.1-70b-versatile", displayName: "Llama 3.1 70B" },
  { id: "llama-3.1-8b-instant", displayName: "Llama 3.1 8B (Fast)" },
  { id: "meta-llama/llama-4-scout-17b-16e-instruct", displayName: "Llama 4 Scout 17B" },
  { id: "meta-llama/llama-4-maverick-17b-128e-instruct", displayName: "Llama 4 Maverick 17B" },
];

const TTL_MS = 5 * 60 * 1000; // 5 minutes
let cache = { data: null, expiresAt: 0 };

router.get("/", async (req, res) => {
  if (cache.data && Date.now() < cache.expiresAt) {
    return res.json({ models: cache.data });
  }

  try {
    const apiKey = req.headers["x-api-key"] || config.groqApiKey;
    if (!apiKey) {
      return res.json({ models: FALLBACK_MODELS });
    }

    const client = new Groq({ apiKey });
    const response = await client.models.list();

    const models = response.data
      .filter((m) => !m.id.includes("whisper") && !m.id.includes("distil"))
      .map((m) => ({ id: m.id, displayName: m.id }))
      .sort((a, b) => a.id.localeCompare(b.id));

    cache = { data: models, expiresAt: Date.now() + TTL_MS };
    res.json({ models });
  } catch {
    res.json({ models: FALLBACK_MODELS });
  }
});

export default router;
