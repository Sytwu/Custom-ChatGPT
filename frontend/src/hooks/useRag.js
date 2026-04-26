const API_BASE = import.meta.env.VITE_API_URL ?? "";
const MAX_MESSAGES_PER_CONV = 20;
const MAX_CORPUS_SIZE = 200;
const MIN_QUERY_LENGTH = 3;
const TOP_K = 5;

/**
 * Given a query and an array of sibling conversations (all convs in the group
 * except the active one), fetches semantically relevant passages from the backend.
 *
 * @param {string} query
 * @param {Array} siblingConversations  — array of conversation objects (each has .messages)
 * @param {string|null} apiKey          — API key (or null to use server env)
 * @returns {Promise<string>}           — formatted context block to prepend to systemPrompt,
 *                                        or empty string if RAG is skipped/failed
 */
export async function fetchRagContext(query, siblingConversations, apiKey) {
  if (!query || query.length < MIN_QUERY_LENGTH) return "";
  if (!siblingConversations || siblingConversations.length === 0) return "";

  // Build corpus: last N messages from each sibling conversation
  let corpus = [];
  for (const conv of siblingConversations) {
    const msgs = (conv.messages ?? []).slice(-MAX_MESSAGES_PER_CONV);
    for (const msg of msgs) {
      if (msg.content?.trim()) {
        corpus.push({ convId: conv.id, role: msg.role, content: msg.content });
      }
    }
  }

  if (corpus.length === 0) return "";

  // Cap total corpus size, dropping oldest entries first
  if (corpus.length > MAX_CORPUS_SIZE) {
    corpus = corpus.slice(corpus.length - MAX_CORPUS_SIZE);
  }

  try {
    const body = { query, corpus, topK: TOP_K };
    if (apiKey) body.apiKey = apiKey;

    console.log(`[RAG] fetching context for query="${query.slice(0, 40)}", corpus size=${corpus.length}`);

    const res = await fetch(`${API_BASE}/api/rag/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.warn("[RAG] search failed:", res.status, errBody.error);
      return "";
    }

    const { passages } = await res.json();
    if (!passages || passages.length === 0) {
      console.log("[RAG] no relevant passages found");
      return "";
    }

    console.log(`[RAG] injecting ${passages.length} passages (top score=${passages[0]?.score?.toFixed(3)})`);

    const block = passages
      .map((p, i) => `[${i + 1}] [${p.role === "assistant" ? "AI回覆" : "使用者"}]: ${p.content}`)
      .join("\n\n");

    return `以下是來自同群組其他對話中與此問題相關的歷史內容，請在回答時優先參考這些資訊：\n\n${block}\n\n---\n\n`;
  } catch (err) {
    console.warn("[RAG] fetch error:", err.message);
    return "";
  }
}
