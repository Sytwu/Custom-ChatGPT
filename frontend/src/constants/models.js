export const MODELS = [
  {
    group: "Groq",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Fast)" },
      { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B (Vision)", vision: true },
      { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 70B (Reasoning)" },
    ],
  },
  {
    group: "NVIDIA NIM",
    models: [
      { id: "meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { id: "nvidia/llama-3.3-nemotron-super-49b-v1", label: "Nemotron Super 49B" },
      { id: "nvidia/llama-3.1-nemotron-nano-8b-v1", label: "Nemotron Nano 8B" },
      { id: "meta/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick 17B (Vision)", vision: true },
      { id: "meta/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B (Vision)", vision: true },
      { id: "meta/llama-3.2-vision-11b-instruct", label: "Llama 3.2 Vision 11B", vision: true },
      { id: "meta/llama-3.2-vision-90b-instruct", label: "Llama 3.2 Vision 90B", vision: true },
      { id: "mistralai/mistral-small-24b-instruct", label: "Mistral Small 24B" },
      { id: "deepseek-ai/deepseek-v3.1", label: "DeepSeek V3.1" },
      { id: "google/gemma-2-9b-it", label: "Gemma 2 9B" },
      { id: "moonshotai/kimi-k2-instruct", label: "Kimi K2" },
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
