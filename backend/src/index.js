import express from "express";
import cors from "cors";
import config from "./config.js";
import chatRouter from "./routes/chat.js";
import ragRouter from "./routes/rag.js";
import suggestRouter from "./routes/suggest.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : "*";
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/chat", chatRouter);
app.use("/api/rag", ragRouter);
app.use("/api/suggest", suggestRouter);

// Global error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});
