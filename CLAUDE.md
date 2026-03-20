# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Express + Node.js)
```bash
cd backend
cp .env.example .env   # fill in API keys
npm install
npm run dev            # nodemon with hot reload
npm start              # production
```

### Frontend (React + Vite)
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL if needed (blank = relative path, localhost dev)
npm install
npm run dev            # Vite dev server on :5173
npm run build          # production build → dist/
npm run preview        # preview production build
```

### Docker (full stack)
```bash
cp backend/.env.example backend/.env   # fill in API keys
docker compose up --build
# backend → :3001, frontend → :5173
```

There are no test or lint commands configured.

## Architecture

### Request Flow
1. User sends message → `useChat.js` applies memory cutoff → `POST /api/chat/stream`
2. Backend `routes/chat.js` → `services/llm.js` dispatches by model ID prefix → `groq.js` or `nvidia.js`
3. Response streams back as SSE (`data: {delta}\n\n`, ends with `data: [DONE]\n\n`)
4. Frontend reads chunks via `fetch` + `ReadableStream` (not `EventSource`) and dispatches `APPEND_TOKEN`

### Model Routing
`services/llm.js` uses prefix matching to route to the correct provider:
- **Groq**: default (no matching prefix)
- **NVIDIA NIM**: prefixes `nvidia/`, `meta/`, `mistralai/`, `google/`, `microsoft/`, `deepseek-ai/`, `qwen/`, `moonshotai/`

Special case: `google/gemma` models don't support system role — the system prompt is prepended to the first user message instead (handled in `routes/chat.js`).

### State Management
All app state lives in a single React Context + useReducer (`context/reducer.js`). No external state library. State is persisted to `localStorage` via `services/storage.js` (separate keys for settings, API keys, conversations, active ID).

Message structure includes `role`, `content`, `attachmentName`, `attachmentText`. The `apiContent()` helper in the reducer expands file attachments into the content string before sending to the API.

### Memory Cutoff
`useChat.js` → `applyMemoryCutoff()`: when memory is enabled, only the last `memoryCutoff * 2` messages (N conversation turns) are sent to the API. The system prompt is always prepended regardless.

### API Keys
Keys can be supplied per-request from the frontend (stored in React state / localStorage) or set server-side via environment variables. The backend prefers the runtime key passed in the request body over the env var.

## Environment Variables

**Backend** (`backend/.env`):
| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key (optional if supplied client-side) |
| `NVIDIA_API_KEY` | NVIDIA NIM API key (optional if supplied client-side) |
| `PORT` | Server port (default: 3001) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins, or `*` |

**Frontend** (`frontend/.env`):
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (empty = same origin, set for prod Render URL) |

## Deployment
- **Backend**: Render (Docker), config in `render.yaml`
- **Frontend**: Vercel (static), config in `frontend/vercel.json`
- See `DEPLOY.md` for full step-by-step instructions
