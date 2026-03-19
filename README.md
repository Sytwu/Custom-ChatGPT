# Custom-ChatGPT
Intro. GenAI Spring 2026 at NYCU

A full-stack ChatGPT-like web application built with React + Express, supporting Groq and NVIDIA NIM models with streaming output.

## Features

- **Multi-model support** — Switch between Groq (Llama, Mixtral, Gemma) and NVIDIA NIM (Nemotron, Llama 405B, Mistral) models via dropdown
- **Custom System Prompt** — Set the AI's persona/instructions at any time
- **Adjustable parameters** — Temperature and Max Tokens controls
- **Streaming output** — Responses appear token by token in real time
- **Short-term memory** — Conversation history included in every request
  - Toggle memory on/off per message
  - Configurable cut-off (keep last N turns) to avoid token limit errors

## Quick Start

### 1. Set up API keys

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your keys:
#   GROQ_API_KEY=...
#   NVIDIA_API_KEY=...
```

Get your keys:
- Groq: https://console.groq.com/keys
- NVIDIA NIM: https://build.nvidia.com/

### 2. Start with Docker Compose

```bash
docker compose up --build
```

Open http://localhost:5173 in your browser.

### 3. Local development (without Docker)

```bash
# Terminal 1 — Backend
cd backend
npm install
npm run dev   # runs on http://localhost:3001

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev   # runs on http://localhost:5173
```

> **Note:** For local dev without Docker, change `vite.config.js` proxy target from `http://backend:3001` to `http://localhost:3001`.

## Project Structure

```
Custom-ChatGPT/
├── backend/            Express API server
│   ├── src/
│   │   ├── index.js           Entry point
│   │   ├── config.js          Environment variable loader
│   │   ├── routes/chat.js     POST /api/chat/stream (SSE)
│   │   ├── services/
│   │   │   ├── groq.js        Groq SDK wrapper
│   │   │   ├── nvidia.js      NVIDIA NIM wrapper (OpenAI-compatible)
│   │   │   └── llm.js         Model dispatch by prefix
│   │   └── middleware/
│   │       └── errorHandler.js
│   ├── .env.example
│   └── Dockerfile
├── frontend/           React + Vite app
│   ├── src/
│   │   ├── context/           AppContext + useReducer state
│   │   ├── hooks/
│   │   │   ├── useChat.js     Streaming logic + memory cutoff
│   │   │   └── useAppContext.js
│   │   ├── components/
│   │   │   ├── layout/        Sidebar, ChatArea
│   │   │   ├── settings/      Model, SystemPrompt, Temperature, Tokens, Memory
│   │   │   ├── chat/          MessageList, MessageBubble, StreamingBubble, InputBar
│   │   │   └── ui/            Toggle
│   │   └── constants/models.js
│   └── Dockerfile
├── docker-compose.yml
└── .gitignore
```

## Architecture

- **Streaming:** SSE wire format from backend → `fetch` + `ReadableStream` on frontend (EventSource not used — it only supports GET)
- **State:** React Context + useReducer (no external state library)
- **Memory cut-off:** Applied in `useChat.js` before each request; full history always shown in UI
- **API key security:** Keys live only in `backend/.env`, never exposed to the browser
