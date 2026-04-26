# Proposal: Custom ChatGPT Web Application

## Why

課程作業需要一個能夠展示 LLM API 串接、Streaming、記憶機制等核心 GenAI 工程能力的網頁應用程式。現有的 ChatGPT 官方介面無法讓使用者自訂 System Prompt、調整模型參數，也無法切換不同廠商的 LLM 模型。本專案旨在打造一個可完全自訂的 ChatGPT 介面，同時確保 API Key 安全性。

主要問題點：
- 直接從瀏覽器呼叫 LLM API 會暴露 API Key（資安風險）
- 無法在同一個介面切換 Groq 與 NVIDIA NIM 兩個不同的 API 來源
- 一般使用者無法調整 System Prompt 與 Temperature 等參數
- Streaming 輸出需要前後端協同設計，實作複雜度較高
- 對話記憶管理（含 cut-off）需要明確的截斷策略，避免超過模型 Token 上限

## What Changes

- **新增** Express 後端作為 API Proxy，保護 Groq 與 NVIDIA NIM 的 API Key
- **新增** React 前端單頁應用，提供完整的對話介面
- **新增** SSE (Server-Sent Events) Streaming 機制，讓 AI 回覆逐字顯示
- **新增** 模型選單，支援 Groq 與 NVIDIA NIM 旗下多個模型
- **新增** System Prompt 輸入框，讓使用者隨時調整 AI 角色設定
- **新增** Temperature 與 Max Tokens 參數控制元件
- **新增** 對話短期記憶，含開關 (Toggle) 與 Cut-off 機制
- **新增** Docker Compose 配置，一指令同時啟動前後端

## Capabilities

1. **model-selection** — 提供下拉選單讓使用者在 Groq 與 NVIDIA NIM 的模型間切換
2. **system-prompt** — 提供文字輸入區讓使用者自訂 System Prompt
3. **api-parameters** — 提供 UI 控制元件讓使用者調整 Temperature 與 Max Tokens
4. **streaming-output** — 後端透過 SSE 將 LLM 回覆串流傳送給前端，逐字顯示
5. **short-term-memory** — 維護對話歷史，支援開關切換與 N-turn Cut-off 截斷機制
6. **security** — API Key 嚴格存放於後端環境變數，不暴露給瀏覽器端

## Impact

**新增檔案：**
- `backend/src/index.js` — Express 入口點
- `backend/src/config.js` — 環境變數讀取與驗證
- `backend/src/routes/chat.js` — `/api/chat/stream` SSE 端點
- `backend/src/services/groq.js` — Groq SDK 封裝
- `backend/src/services/nvidia.js` — NVIDIA NIM (OpenAI-compatible) 封裝
- `backend/src/services/llm.js` — 依 model ID 分派至對應服務
- `backend/src/middleware/errorHandler.js` — 全域錯誤處理
- `frontend/src/context/AppContext.jsx` — React Context Provider
- `frontend/src/context/reducer.js` — 狀態機（全域 state + actions）
- `frontend/src/hooks/useChat.js` — Streaming 邏輯與 Memory Cut-off 計算
- `frontend/src/components/` — 所有 UI 元件（Sidebar、ChatArea、Settings、Chat）
- `docker-compose.yml` — 前後端容器編排
- `backend/.env.example` — API Key 範本（不含真實金鑰）
- `.gitignore` — 確保 `.env` 不被提交
