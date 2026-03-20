import express from "express";
import cors from "cors";
import config from "./config.js";
import chatRouter from "./routes/chat.js";
import ragRouter from "./routes/rag.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : "*";
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/chat", chatRouter);
app.use("/api/rag", ragRouter);

// Global error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});
