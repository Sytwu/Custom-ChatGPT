## ADDED Requirements

### Requirement: 後端 Agentic Tool Call Loop
當 tool use 啟用且對話模型支援工具時，`routes/chat.js` SHALL 執行 agentic loop：以 non-streaming 呼叫 LLM（含 tools 定義），若 `finish_reason === "tool_calls"` 則執行對應工具，將結果加入 messages 後再次呼叫 LLM，直到 `finish_reason === "stop"` 或達到 5 輪上限，最後以 streaming 回傳最終回覆。

#### Scenario: LLM 呼叫搜尋工具
- **WHEN** 使用者問「今天台股收盤」，tool use 開啟
- **THEN** LLM 回傳 tool call（`web_search`），後端執行搜尋，將結果附加 messages 後繼續呼叫 LLM，最終 stream 回覆

#### Scenario: LLM 呼叫 Python 執行工具
- **WHEN** 使用者要求「計算費波那契數列前 10 項」，tool use 開啟
- **THEN** LLM 回傳 tool call（`python_execute`），後端執行程式碼，將 stdout 附加後繼續呼叫 LLM

#### Scenario: Loop 超過 5 輪
- **WHEN** LLM 連續呼叫工具超過 5 次
- **THEN** 後端停止 loop，stream 一則提示訊息後送出 `[DONE]`

#### Scenario: Tool use 關閉
- **WHEN** 請求中 `toolsEnabled: false`
- **THEN** 後端跳過 tool 定義，直接使用原本 streaming 流程

### Requirement: SSE 工具狀態事件
後端在 tool call loop 期間 SHALL 透過 SSE 推送狀態事件，讓前端顯示進度。

#### Scenario: 推送工具呼叫事件
- **WHEN** 後端準備執行工具
- **THEN** 推送 `data: {"toolCall":{"name":"web_search","input":{"query":"..."}}}\n\n`

#### Scenario: 推送工具結果事件
- **WHEN** 工具執行完成
- **THEN** 推送 `data: {"toolResult":{"name":"web_search","output":"..."}}\n\n`

### Requirement: 前端 Tool Use 開關與狀態顯示
前端 Settings SHALL 提供 tool use 開關（Toggle）。`useChat.js` SHALL 在請求中帶入 `toolsEnabled` 欄位。MessageList SHALL 在 streaming 期間顯示工具呼叫狀態，結束後在訊息中附加可折疊的工具呼叫記錄。

#### Scenario: Tool use 開啟時顯示工具呼叫進度
- **WHEN** AI 正在呼叫工具（收到 `toolCall` SSE 事件）
- **THEN** ChatArea 顯示「正在搜尋...」或「正在執行程式碼...」loading indicator

#### Scenario: 工具結果顯示於訊息
- **WHEN** stream 結束，訊息含有工具呼叫記錄
- **THEN** 訊息下方顯示可折疊的 `ToolCallBlock`，列出工具名稱與輸出摘要
