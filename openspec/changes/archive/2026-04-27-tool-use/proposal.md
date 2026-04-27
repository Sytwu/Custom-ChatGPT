## Why

目前 AI 只能根據對話歷史回答問題，無法主動取得即時資訊或執行程式碼。新增 Tool Use 功能讓 AI 能呼叫網路搜尋與 Python 執行工具，大幅擴展能力範圍，滿足需要即時資料或計算驗證的使用情境。

## What Changes

- 新增後端 Tool Use 代理流程：`POST /api/chat/stream` 改支援工具呼叫循環（tool call → tool execute → continue stream）
- 新增後端 `/api/tools/search` endpoint：整合 Brave Search API 執行網路搜尋，回傳結構化結果
- 新增後端 `/api/tools/python` endpoint：使用 Python subprocess 在沙箱環境執行程式碼，回傳 stdout/stderr 與執行時間（設定執行 timeout）
- 前端 UI 顯示工具呼叫過程（「正在搜尋...」、「正在執行程式碼...」）與工具結果區塊
- 新增 Settings 開關讓使用者啟用/停用 tool use

### Non-goals

- 不支援自訂工具或 MCP 協定整合（僅內建搜尋與 Python）
- Python 執行不提供持久化狀態（每次獨立 subprocess，無共享 session）
- 不支援工具呼叫的串流中途顯示（工具結果等完成再繼續 stream）
- 不支援並行工具呼叫（sequential only）

## Capabilities

### New Capabilities

- `web-search-tool`: 後端 Brave Search API 整合；接受查詢字串，回傳摘要結果供 LLM 使用
- `python-execution-tool`: 後端 Python subprocess 執行；接受程式碼字串，回傳 stdout/stderr，含 timeout 保護
- `tool-use-agent`: 後端 agentic loop：解析 LLM tool call → 執行對應工具 → 將結果回送 LLM → 繼續 stream；前端顯示工具呼叫狀態 UI

### Modified Capabilities

- `streaming-output`: SSE stream 新增工具呼叫狀態事件（`data: {"toolCall": {...}}`、`data: {"toolResult": {...}}`）

## Impact

- **新增**：`backend/src/services/tools/search.js`、`backend/src/services/tools/python.js`、`backend/src/services/tools/index.js`
- **修改**：`backend/src/routes/chat.js`（tool call loop）、`backend/src/services/groq.js`（加入 tools 參數）
- **新增**：`backend/.env.example` 新增 `TAVILY_API_KEY`
- **修改**：`frontend/src/hooks/useChat.js`（處理 toolCall/toolResult SSE 事件）、`frontend/src/components/chat/MessageList.jsx`（顯示工具狀態）
- **新增**：`frontend/src/components/chat/ToolCallBlock.jsx`
- **依賴**：需申請 Tavily API key（免費方案每月 1,000 次，專為 AI agent 設計）；Python 3 需在執行環境中可用
