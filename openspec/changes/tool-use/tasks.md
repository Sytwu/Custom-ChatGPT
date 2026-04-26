## 1. 後端：工具服務實作

- [ ] 1.1 建立 `backend/src/services/tools/search.js`：實作 `searchWeb(query)` 函式，以 `fetch` POST `https://api.tavily.com/search`（body: `{ api_key: TAVILY_API_KEY, query, max_results: 5 }`），格式化回傳的 `results[]`（title、url、content 前 300 字）為文字塊；key 未設定或呼叫失敗時回傳錯誤字串
- [ ] 1.2 建立 `backend/src/services/tools/python.js`：實作 `executePython(code)` 函式，使用 `child_process.spawn(['python3', '-c', code], { timeout: 10000 })`，捕捉 stdout、stderr；timeout 時設 `timedOut: true`；python3 不存在時回傳對應錯誤字串
- [ ] 1.3 建立 `backend/src/services/tools/index.js`：匯出 `TOOLS_DEFINITION`（Groq function calling 格式的工具定義陣列，含 `web_search` 與 `python_execute` 兩個工具）及 `executeTool(name, input)` dispatcher 函式
- [ ] 1.4 在 `backend/.env.example` 新增 `TAVILY_API_KEY` 欄位與說明（申請：tavily.com，免費 1,000 次/月）

## 2. 後端：Agentic Loop 整合

- [ ] 2.1 在 `backend/src/services/groq.js` 新增 `completeChatWithTools(messages, model, tools, apiKey)` 函式：呼叫 Groq non-streaming completion，傳入 `tools` 參數，回傳完整 response 物件（含 `finish_reason` 與 `tool_calls`）
- [ ] 2.2 在 `backend/src/routes/chat.js` 讀取請求中的 `toolsEnabled` 欄位（預設 false）；若為 true 且工具定義存在，進入 agentic loop 模式
- [ ] 2.3 在 `chat.js` 實作 agentic loop（最多 5 輪）：
  - 呼叫 `completeChatWithTools()` → 若 `finish_reason === "tool_calls"` → 推送 `toolCall` SSE 事件 → 呼叫 `executeTool()` → 推送 `toolResult` SSE 事件 → 將 tool result 附加到 messages → 繼續迴圈
  - `finish_reason === "stop"` 或達到 5 輪時離開 loop
- [ ] 2.4 在 `chat.js` loop 結束後，以原本 streaming 方式呼叫最終 LLM 回覆（不帶 tools）並串流輸出
- [ ] 2.5 在 `chat.js` 推送 `toolCall`/`toolResult` 事件：格式 `data: {"toolCall":{...}}\n\n` 和 `data: {"toolResult":{...}}\n\n`

## 3. 前端：Tool Use 狀態管理

- [ ] 3.1 在 `frontend/src/context/reducer.js` 的 `initialState` 新增 `toolsEnabled: false` 和 `streamingToolCalls: []`
- [ ] 3.2 在 `context/actions.js` 新增 `SET_TOOLS_ENABLED`、`ADD_TOOL_CALL`、`CLEAR_TOOL_CALLS` action types
- [ ] 3.3 在 `reducer.js` 處理三個新 action；`FINISH_STREAM` 時將 `streamingToolCalls` 附加到最後一則 assistant message 的 `toolCalls` 欄位後清空
- [ ] 3.4 在 `context/AppContext.jsx` 的 localStorage 持久化中加入 `toolsEnabled`（存入 `ccgpt_settings`）

## 4. 前端：useChat 整合

- [ ] 4.1 在 `frontend/src/hooks/useChat.js` 送出請求時帶入 `toolsEnabled` 欄位
- [ ] 4.2 在 `useChat.js` 的 SSE 讀取迴圈中新增對 `toolCall` 和 `toolResult` 事件的處理：分別 dispatch `ADD_TOOL_CALL`（附加 type + data）
- [ ] 4.3 在 `translations.js` 新增工具相關字串（zh-TW + en）：「正在搜尋...」、「正在執行程式碼...」、「工具呼叫記錄」

## 5. 前端：UI 元件

- [ ] 5.1 建立 `frontend/src/components/chat/ToolCallBlock.jsx`：接收 `toolCalls` 陣列 prop，以可折疊方式顯示每個工具呼叫的名稱（搜尋/Python 圖示）、input 摘要、output 內容；預設折疊
- [ ] 5.2 在 `frontend/src/components/chat/MessageBubble.jsx` 和 `DiscordMessageBubble.jsx` 的 assistant 訊息中，若 `message.toolCalls` 非空，渲染 `ToolCallBlock`
- [ ] 5.3 在 `frontend/src/components/layout/ChatArea.jsx` 或 `StreamingBubble.jsx` 中，若 `streamingToolCalls` 有進行中的項目，顯示 loading indicator（如「🔍 正在搜尋...」或「🐍 正在執行程式碼...」）
- [ ] 5.4 在適當的 Settings 元件中新增 tool use Toggle，dispatch `SET_TOOLS_ENABLED`
- [ ] 5.5 在 `frontend/src/styles.css` 新增 `.tool-call-block` 相關樣式（折疊動畫、工具圖示、output 等寬字體）

## 6. 驗證

- [ ] 6.1 執行 `npm run build` 確認前端無錯誤
- [ ] 6.2 手動測試：開啟 tool use，問「今天的比特幣價格」→ 確認顯示搜尋 loading → 結果顯示在訊息中
- [ ] 6.3 手動測試：開啟 tool use，請 AI 寫 Python 計算 → 確認執行 loading → stdout 顯示在 ToolCallBlock
- [ ] 6.4 手動測試：關閉 tool use → 確認不呼叫工具，正常串流回覆
- [ ] 6.5 手動測試：Python 執行超時（無限迴圈）→ 確認 10 秒後回傳 timedOut，AI 回報錯誤
