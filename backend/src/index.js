import express from "express";
import cors from "cors";
import passport from "passport";
import config from "./config.js";
import chatRouter from "./routes/chat.js";
import ragRouter from "./routes/rag.js";
import suggestRouter from "./routes/suggest.js";
import authRouter from "./routes/auth.js";
import memoryRouter from "./routes/memory.js";
import compressRouter from "./routes/compress.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : "*";
app.set("trust proxy", 1);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "50mb" }));
app.use(passport.initialize());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/chat", chatRouter);
app.use("/api/rag", ragRouter);
app.use("/api/suggest", suggestRouter);
app.use("/api/auth", authRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/compress", compressRouter);

// Global error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});
