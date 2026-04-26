## Context

Groq SDK 支援 OpenAI 相容的 tool/function calling 格式。後端目前的 `streamChat()` 以 async iterable 串流回傳，需要改為能偵測 tool call finish reason 並執行 agentic loop。Python 執行需要沙箱保護（timeout + 資源限制）。

## Goals / Non-Goals

**Goals:**
- 後端 agentic loop：LLM → tool call → execute → LLM continue，直到 `stop` 為止
- 前端 SSE 新事件類型：`toolCall`（呼叫中）、`toolResult`（結果）讓 UI 可顯示進度
- 網路搜尋：Brave Search API，回傳前 5 筆摘要
- Python 執行：subprocess with 10 秒 timeout，捕捉 stdout + stderr

**Non-Goals:**
- MCP 協定、自訂工具
- Python session 持久化
- 並行工具呼叫

## Decisions

### 1. Tool Call Loop：後端完整執行，前端僅展示

**選擇**：整個 agentic loop（LLM → tool → LLM → ...）在後端執行。每個步驟透過 SSE 推送狀態事件給前端：`data: {"toolCall":{"name":"search","input":{...}}}` 和 `data: {"toolResult":{"name":"search","output":"..."}}` 。最終 LLM 回覆繼續以 `{"delta":"..."}` 串流。

**理由**：前端邏輯保持簡單（只需渲染新事件類型），後端掌控工具執行的安全與 timeout。Loop 最多 5 輪防止無限呼叫。

**替代方案**：前端呼叫工具再回傳結果 → API key 暴露風險、前後端狀態同步複雜，不採用。

### 2. Groq Tool Use：non-streaming 第一次呼叫，streaming 最終回覆

**選擇**：有 tools 定義時，第一次 LLM 呼叫使用 non-streaming（`completeChat()`）以便偵測 `finish_reason: "tool_calls"`。工具執行後，最後一次 LLM 呼叫（無 tools）改回 streaming。

**理由**：Groq streaming 加上 tool calling 的 finish_reason 解析較複雜；non-streaming 第一次呼叫讓邏輯清晰，延遲可接受（工具本身有 I/O 延遲）。

### 3. Python 沙箱：subprocess + timeout

**選擇**：使用 Node.js `child_process.spawn(['python3', '-c', code])`，設定 `timeout: 10000`（10 秒），`maxBuffer: 1MB`。不允許網路存取（不特別設定，只靠 timeout 保護）。

**理由**：最簡單的實作，適合課堂作業環境。完整沙箱（Docker-in-Docker、gVisor）過於複雜。

**風險**：惡意程式碼可能消耗大量 CPU → Mitigation: 10 秒 hard timeout；`ulimit` 在 Docker 環境中可額外設定。

### 4. 網路搜尋：Tavily Search API

**選擇**：呼叫 Tavily Search API（`POST https://api.tavily.com/search`），帶入 `{ query, max_results: 5 }`，回傳已整理好的 `results[].content` 與 `url`，格式化成文字塊回傳給 LLM。

**理由**：Tavily 免費方案 1,000 次/月，不需信用卡，且專為 LLM/Agent 設計，回傳內容已去除 HTML 噪音，比 Brave 更適合直接餵給 LLM。

**替代方案**：Brave Search → 已無免費方案；Serper、Google Search API → 需信用卡或較複雜設定。

### 5. 前端 toolCall/toolResult 事件顯示

**選擇**：新增 `ToolCallBlock` 元件，以可折疊的方式顯示工具呼叫名稱、輸入、輸出。狀態存在 `streamingToolCalls` array（reducer state），stream 結束後附加到 message 物件的 `toolCalls` 欄位。

## Risks / Trade-offs

- **Python 執行安全性** → Mitigation: 10 秒 timeout，僅在受控環境（Docker）部署
- **Tavily API quota 耗盡（1,000 次/月）** → Mitigation: tool 回傳 error 字串，LLM 繼續回答；不阻擋整體對話
- **Groq tool calling 不支援某些模型** → Mitigation: 文件標注需使用支援 tool use 的模型（llama-3.3-70b-versatile、llama-3.1-70b-versatile）；若模型不支援則跳過 tool use
- **Loop 無限呼叫** → Mitigation: 最多 5 輪 tool call，超過則強制結束並提示
