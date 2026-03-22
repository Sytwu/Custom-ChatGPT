# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (Express + Node.js)
```bash
cd backend
cp .env.example .env   # fill in API keys
npm install
npm run dev            # nodemon with hot reload on :3001
npm start              # production
```

### Frontend (React + Vite)
```bash
cd frontend
cp .env.example .env   # set VITE_API_URL if needed (blank = relative path, localhost dev)
npm install
npm run dev            # Vite dev server on :5173 (proxies /api/* → :3001 automatically)
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
1. User sends message → `useChat.js` applies memory cutoff → optionally fetches RAG context → `POST /api/chat/stream`
2. Backend `routes/chat.js` → `services/llm.js` dispatches by model ID prefix → `groq.js` or `nvidia.js`
3. Response streams back as SSE (`data: {"delta":"..."}\n\n`, ends with `data: [DONE]\n\n`)
4. Frontend reads chunks via `fetch` + `ReadableStream` (not `EventSource`) and dispatches `APPEND_TOKEN`

### Model Routing
`services/llm.js` uses prefix matching to route to the correct provider:
- **Groq**: default (no matching prefix). Important: `meta-llama/` routes to Groq, `meta/` routes to NVIDIA NIM — do not confuse them.
- **NVIDIA NIM**: prefixes `nvidia/`, `meta/`, `mistralai/`, `google/`, `microsoft/`, `deepseek-ai/`, `qwen/`, `moonshotai/`

Both `llm.js` and `useChat.js` maintain identical `NVIDIA_PREFIXES` arrays — keep them in sync when adding providers.

Special cases in `routes/chat.js`:
- `google/gemma` models don't support system role — the system prompt is prepended to the first user message instead. They also require strict user/assistant alternation — consecutive same-role messages are merged (content joined with `\n\n`) before the request is sent.
- Message `content` may be a **string or an array** (OpenAI vision format for image attachments); the backend passes it through as-is.

Both providers expose `streamChat()` and `completeChat()` (non-streaming) in their service files. `llm.js` dispatches both.

### State Management
All app state lives in a single React Context + useReducer (`context/reducer.js`). State shape:
```js
{
  groqApiKey, nvidiaApiKey,
  model, systemPrompt, temperature, maxTokens,
  memoryEnabled, memoryCutoff,
  theme,       // "dark" | "light"
  language,    // "zh-TW" | "en"
  conversations: [{ id, title, messages, color, groupId, titleLocked, createdAt }],
  activeConversationId,
  groups: [{ id, name, color, collapsed, ragEnabled, createdAt }],
  isStreaming, streamingContent, error
}
```
State is persisted to `localStorage` via `services/storage.js` using 5 separate keys (`ccgpt_settings`, `ccgpt_api_keys`, `ccgpt_conversations`, `ccgpt_active_id`, `ccgpt_groups`). Saving is skipped during active streaming to reduce churn. `AppContext.jsx` applies `data-theme` to `document.documentElement` whenever `state.theme` changes.

### Message & Attachment Architecture
Message objects store `{ role, content, attachmentName, attachmentText, attachmentImageData, timestamp, replyTo, reactions, stickerUrl, stickerDescription }`. Full attachment content is stored separately from `content` to keep UI display clean. The `apiContent(msg)` helper in `reducer.js` expands at API-send time:
- **Text attachment** → appends file content as a fenced block to the content string
- **Image attachment** → returns OpenAI vision array format `[{type:"text",...}, {type:"image_url",...}]`

File extraction (`utils/fileExtractor.js`) supports PDF (via `pdfjs-dist`), plain text, and code/data files up to 50K characters. PDF text is normalized (empty items filtered, consecutive newlines collapsed) before being sent to the LLM. Images are compressed via Canvas API in `InputBar.jsx` before encoding — resized to max 1920px on the long edge and converted to JPEG at 85% quality. The backend JSON body limit is 50 MB.

### Discord Mode
Per-conversation toggle (`conversation.discordMode`). When active:
- **Input behaviour**: Enter adds to a message queue (not sends); Shift+Enter inserts newline; a "全部送出 (N)" button sends all queued messages at once.
- **Message queue**: `msgQueue` state lives in `ChatArea.jsx` (lifted from InputBar) and is passed as `pendingMessages` to `MessageList`. Pending messages render as semi-transparent `DiscordMessageBubble` components (no hover actions) until sent.
- **Batch send**: `sendMessageBatch()` in `useChat.js` builds the full API payload from current state *before* dispatching user messages (critical — React 18 batches all dispatches), then dispatches each message as a separate `ADD_USER_MESSAGE`, and streams one unified API response.
- **Stickers**: Selecting a sticker in Discord mode queues it as a pending bubble `{ content, stickerUrl, stickerDescription }`; in non-Discord mode it sends immediately via `sendSticker()`.
- **System prompt prefix**: Discord mode prepends a brevity instruction to the system prompt.
- **Rendering**: `MessageList.jsx` uses `DiscordMessageBubble` for all messages (with grouping by timestamp) instead of `MessageBubble`. Emoji reactions are stored per-message in `reactions: {}` and rendered in `DiscordMessageBubble`.

### Sticker System
Sticker packs are configured in `frontend/src/constants/stickers.json` (edit this to update descriptions). `stickers.js` imports the JSON and exposes `STICKER_PACKS` and `stickerUrl()`. Images live in `frontend/public/stickers/<folder>/01.png` etc. The `StickerPicker` component renders inside a `ReactDOM.createPortal` to `document.body` (fixed positioning) to escape `overflow: hidden` parents. Sticker descriptions are sent to the LLM as `[sticker: <description>]`.

### i18n
All UI strings go through `useT()` from `frontend/src/i18n/useT.js`. Add new strings to both `"zh-TW"` and `"en"` entries in `frontend/src/i18n/translations.js`. Dynamic strings (e.g. `memoryHint`) are stored as functions and called as `t("key", arg)`.

### Vision Models
`constants/models.js` exports `isVisionModel(modelId)` — only models with `vision: true` in the `MODELS` array return true. `InputBar.jsx` shows a warning and blocks sending if an image is attached but the current model is not vision-capable. When adding new models, mark vision-capable ones with `vision: true`.

### Prompt Suggestion
`POST /api/suggest` (non-streaming) takes `{ text, model, apiKey }` and returns `{ improved, templates[] }` as JSON. The backend uses a fixed system prompt that instructs the LLM to respond with that exact JSON shape. The ✨ button in `InputBar.jsx` is always visible; it is disabled when there is no text or while streaming.

### Memory Cutoff
`useChat.js` → `applyMemoryCutoff()`: when memory is disabled, only the **last message** is sent. When enabled, the last `memoryCutoff * 2` messages are sent (N conversation turns). The system prompt is always prepended regardless.

### RAG (Group-Scoped Semantic Search)
When a conversation belongs to a group with `ragEnabled: true`, `useChat.js` calls `useRag.js` → `fetchRagContext()` before streaming:
1. Collects messages from all sibling conversations in the group (last 20 per convo, max 200 total, 2000 chars/passage)
2. `POST /api/rag/search` → `services/embeddings.js` embeds query and corpus via NVIDIA NIM (`nvidia/nv-embedqa-e5-v5`)
3. Top-K passages ranked by cosine similarity are prepended to the system prompt as Chinese-labeled context blocks
4. **Requires NVIDIA API key** — silently returns empty string if unavailable

### API Keys
Keys can be supplied per-request from the frontend (stored in React state / localStorage) or set server-side via environment variables. The backend prefers the runtime key passed in the request body over the env var.

### Sidebar & Drag-Drop
`ConversationSidebar.jsx` uses `@dnd-kit/core` (PointerSensor) to allow dragging conversations into groups. Groups are rendered via `GroupRow.jsx` as droppable zones with collapse, color picker, rename/delete, and a RAG toggle. Conversation colors come from a 10-color `PALETTE` in `constants/colors.js`.

### Markdown Rendering
Assistant messages are rendered via `MarkdownContent.jsx` (ReactMarkdown + rehype-highlight). **Do not apply `white-space: pre-wrap` to `.message-bubble` broadly** — it causes every `\n` in LLM output to render as a hard line break, bypassing markdown parsing. `pre-wrap` is scoped only to `.message-bubble.user`. `MarkdownContent` normalizes 3+ consecutive newlines to 2 before passing content to ReactMarkdown.

### Error Handling
- **Backend**: SSE errors are streamed as `data: {"error":"..."}\n\n` then closed with `[DONE]`, so the client always gets a clean terminal event
- **Frontend**: RAG errors are non-fatal (warnings only); stream errors dispatch `STREAM_ERROR`; file extraction returns `{name, text, error}` objects; storage ops silently fail (private mode safe)

## Environment Variables

**Backend** (`backend/.env`):
| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key (optional if supplied client-side) |
| `NVIDIA_API_KEY` | NVIDIA NIM API key (required for RAG; optional otherwise) |
| `PORT` | Server port (default: 3001) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins, or `*` |

**Frontend** (`frontend/.env`):
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL (empty = same origin; set to Render URL in prod) |

## Key Files by Task

| Goal | Files |
|------|-------|
| Add LLM provider | `backend/src/services/llm.js`, `groq.js`, `nvidia.js` |
| Add/update models | `frontend/src/constants/models.js` (also update `NVIDIA_PREFIXES` in `llm.js` + `useChat.js` if adding a new vendor prefix) |
| Modify streaming | `backend/src/routes/chat.js`, `frontend/src/hooks/useChat.js` |
| Change state shape | `frontend/src/context/reducer.js`, `actions.js`, `AppContext.jsx` (persistence) |
| Add a settings field | `reducer.js` initialState + `components/settings/` + `i18n/translations.js` |
| Add UI strings | `frontend/src/i18n/translations.js` (both `zh-TW` and `en`) |
| Fix/extend RAG | `frontend/src/hooks/useRag.js`, `backend/src/routes/rag.js`, `services/embeddings.js` |
| Prompt suggestions | `backend/src/routes/suggest.js`, `frontend/src/components/chat/PromptSuggestions.jsx` |
| Image / vision | `frontend/src/components/chat/InputBar.jsx`, `context/reducer.js` (`apiContent`), `constants/models.js` |
| Discord mode / queue | `components/layout/ChatArea.jsx`, `hooks/useChat.js` (`sendMessageBatch`), `components/chat/DiscordMessageBubble.jsx`, `MessageList.jsx` |
| Sticker packs / descriptions | `frontend/src/constants/stickers.json` (data), `stickers.js` (loader), `components/chat/StickerPicker.jsx` |
| Sidebar / drag-drop | `components/layout/ConversationSidebar.jsx`, `GroupRow.jsx` |
| Storage / persistence | `frontend/src/services/storage.js`, `context/AppContext.jsx` |
| Theme / styling | `frontend/src/styles.css` (CSS variables in `:root` and `[data-theme="light"]`) |

## Deployment
- **Backend**: Render (Docker), config in `render.yaml`; set `ALLOWED_ORIGINS` to the Vercel frontend URL
- **Frontend**: Vercel (static), config in `frontend/vercel.json`; set `VITE_API_URL` to the Render backend URL, then redeploy after changing env vars
- See `DEPLOY.md` for full step-by-step instructions
