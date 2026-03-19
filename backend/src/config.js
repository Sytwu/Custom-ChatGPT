import "dotenv/config";

const config = {
  groqApiKey: process.env.GROQ_API_KEY,
  nvidiaApiKey: process.env.NVIDIA_API_KEY,
  port: parseInt(process.env.PORT ?? "3001", 10),
};

if (!config.groqApiKey) {
  console.error("ERROR: GROQ_API_KEY is not set in .env");
  process.exit(1);
}
if (!config.nvidiaApiKey) {
  console.error("ERROR: NVIDIA_API_KEY is not set in .env");
  process.exit(1);
}

export default config;
