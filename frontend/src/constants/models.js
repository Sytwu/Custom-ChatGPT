export const MODELS = [
  {
    group: "Groq",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Fast)" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
      { id: "gemma2-9b-it", label: "Gemma 2 9B" },
    ],
  },
  {
    group: "NVIDIA NIM",
    models: [
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", label: "Nemotron 70B" },
      { id: "meta/llama-3.1-405b-instruct", label: "Llama 3.1 405B" },
      { id: "mistralai/mistral-large-2-instruct", label: "Mistral Large 2" },
      { id: "google/gemma-2-27b-it", label: "Gemma 2 27B" },
    ],
  },
];

export const DEFAULT_MODEL = MODELS[0].models[0].id;
