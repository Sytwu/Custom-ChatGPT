import "dotenv/config";

const config = {
  groqApiKey: process.env.GROQ_API_KEY,
  nvidiaApiKey: process.env.NVIDIA_API_KEY,
  port: parseInt(process.env.PORT ?? "3001", 10),
};

if (!config.groqApiKey) {
  console.warn("WARN: GROQ_API_KEY is not set — must be supplied per-request via Settings");
}
if (!config.nvidiaApiKey) {
  console.warn("WARN: NVIDIA_API_KEY is not set — must be supplied per-request via Settings");
}

export default config;
