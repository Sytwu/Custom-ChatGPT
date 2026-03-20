import OpenAI from "openai";
import config from "../config.js";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const EMBEDDING_MODEL = "nvidia/nv-embedqa-e5-v5";

function makeClient(apiKey) {
  const key = apiKey || config.nvidiaApiKey;
  if (!key) {
    throw new Error("No NVIDIA API key available. Please add your NVIDIA API key in Settings.");
  }
  return new OpenAI({ apiKey: key, baseURL: NVIDIA_BASE_URL });
}

/**
 * Generates embeddings for a query and a list of passage strings in parallel.
 * Returns { queryVec: number[], passageVecs: number[][] }
 */
export async function embedQueryAndPassages(query, passages, apiKey) {
  const client = makeClient(apiKey);

  const [queryRes, passageRes] = await Promise.all([
    client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: [query],
      input_type: "query",
      truncate: "END",
    }),
    passages.length > 0
      ? client.embeddings.create({
          model: EMBEDDING_MODEL,
          input: passages,
          input_type: "passage",
          truncate: "END",
        })
      : Promise.resolve({ data: [] }),
  ]);

  const queryVec = queryRes.data[0].embedding;
  const passageVecs = passageRes.data.map((d) => d.embedding);
  return { queryVec, passageVecs };
}

/** Cosine similarity between two equal-length vectors */
export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
