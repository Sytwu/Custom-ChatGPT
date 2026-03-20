export const MODELS = [
  {
    group: "Groq",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Fast)" },
      { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B" },
      { id: "qwen/qwen3-32b", label: "Qwen3 32B" },
    ],
  },
  {
    group: "NVIDIA NIM",
    models: [
      { id: "meta/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { id: "nvidia/llama-3.3-nemotron-super-49b-v1", label: "Nemotron Super 49B" },
      { id: "nvidia/llama-3.1-nemotron-nano-8b-v1", label: "Nemotron Nano 8B" },
      { id: "mistralai/mistral-small-24b-instruct", label: "Mistral Small 24B" },
      { id: "google/gemma-2-27b-it", label: "Gemma 2 27B" },
      { id: "deepseek-ai/deepseek-v3.1", label: "DeepSeek V3.1" },
      { id: "qwen/qwq-32b", label: "QwQ 32B (Reasoning)" },
      { id: "moonshotai/kimi-k2-instruct", label: "Kimi K2" },
    ],
  },
];

export const DEFAULT_MODEL = MODELS[0].models[0].id;
