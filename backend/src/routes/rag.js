import express from "express";
import { embedQueryAndPassages, cosineSimilarity } from "../services/embeddings.js";

const ragRouter = express.Router();

/**
 * POST /api/rag/search
 * Body: { query, corpus: [{convId, role, content}], topK?, apiKey? }
 * Returns: { passages: [{convId, content, score}] }
 */
ragRouter.post("/search", async (req, res) => {
  const { query, corpus, topK = 5, apiKey } = req.body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "query is required" });
  }
  if (!Array.isArray(corpus) || corpus.length === 0) {
    return res.json({ passages: [] });
  }

  const texts = corpus.map((p) => String(p.content ?? "").slice(0, 2000));

  try {
    const { queryVec, passageVecs } = await embedQueryAndPassages(
      query.trim(),
      texts,
      apiKey
    );

    const scored = corpus.map((p, i) => ({
      convId: p.convId,
      content: p.content,
      score: cosineSimilarity(queryVec, passageVecs[i]),
    }));

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.min(topK, 20));

    console.log(`[RAG] query="${query.slice(0, 40)}…" corpus=${corpus.length} → top score=${top[0]?.score?.toFixed(3)}`);
    res.json({ passages: top });
  } catch (err) {
    console.error("[RAG] embedding error:", err.message);
    res.status(500).json({ error: err.message ?? "Embedding error" });
  }
});

export default ragRouter;
