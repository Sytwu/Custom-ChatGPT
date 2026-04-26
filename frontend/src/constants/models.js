// Static fallback list used when /api/models is unavailable
export const MODELS = [
  {
    group: "Groq",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "llama-3.1-70b-versatile", label: "Llama 3.1 70B" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Fast)" },
      { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B (Vision)", vision: true },
      { id: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B (Vision)", vision: true },
    ],
  },
];

export const DEFAULT_MODEL = MODELS[0].models[0].id;

/** Returns true if the given model ID supports vision (image input). */
export function isVisionModel(modelId) {
  for (const group of MODELS) {
    for (const m of group.models) {
      if (m.id === modelId) return m.vision === true;
    }
  }
  return false;
}
