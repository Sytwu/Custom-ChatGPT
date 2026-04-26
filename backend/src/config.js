import "dotenv/config";

const config = {
  groqApiKey: process.env.GROQ_API_KEY,
  tavilyApiKey: process.env.TAVILY_API_KEY,
  port: parseInt(process.env.PORT ?? "3001", 10),
};

if (!config.groqApiKey) {
  console.warn("WARN: GROQ_API_KEY is not set — must be supplied per-request via Settings");
}
if (!config.tavilyApiKey) {
  console.warn("WARN: TAVILY_API_KEY is not set — web search tool will be unavailable");
}

export default config;
