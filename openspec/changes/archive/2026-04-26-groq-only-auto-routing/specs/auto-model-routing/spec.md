## ADDED Requirements

### Requirement: 後端路由分析 endpoint
後端 SHALL 提供 `POST /api/route`，接收 `{ message, model, apiKey }`，使用 `llama-3.1-8b-instant` 以固定 system prompt 分析訊息內容，以 non-streaming `completeChat()` 回傳 `{ modelId, reason }`。後端 SHALL 驗證推薦的 modelId 是否在可用模型清單中；若不在清單中，SHALL fallback 到 `llama-3.1-8b-instant`。

#### Scenario: 成功路由簡單對話
- **WHEN** 使用者傳送一般對話訊息，呼叫 `POST /api/route`
- **THEN** 後端回傳 `{ modelId: "llama-3.1-8b-instant", reason: "..." }`，HTTP 200

#### Scenario: 成功路由複雜程式碼任務
- **WHEN** 使用者傳送含程式碼或複雜分析的訊息
- **THEN** 後端回傳較大模型的 modelId（如 `llama-3.3-70b-versatile`），HTTP 200

#### Scenario: 路由結果 modelId 不在可用清單
- **WHEN** 路由 LLM 回傳的 modelId 不存在於 `/api/models` 的可用清單中
- **THEN** 後端改回傳 `{ modelId: "llama-3.1-8b-instant", reason: "fallback" }`，HTTP 200

#### Scenario: 無 API key 時路由失敗
- **WHEN** 沒有可用的 Groq API key
- **THEN** 後端回傳 HTTP 400，前端跳過路由並使用使用者當前選擇的模型

### Requirement: 前端 auto-routing 整合
前端 `useChat.js` SHALL 在 auto-routing 開啟時，於送出訊息前呼叫 `POST /api/route` 取得推薦模型，並以推薦模型送出 chat request。auto-routing 的結果 SHALL 不覆蓋使用者在 Settings 中的模型選擇持久化設定（僅影響本次送出）。

#### Scenario: Auto-routing 開啟時自動選模型
- **WHEN** `autoRouting` 設定為 true，使用者送出訊息
- **THEN** useChat 先呼叫 `/api/route`，取得 modelId 後以該模型送出 chat stream

#### Scenario: Auto-routing 關閉時使用使用者選擇的模型
- **WHEN** `autoRouting` 設定為 false
- **THEN** useChat 跳過路由呼叫，直接使用 state 中的 model 送出

#### Scenario: 路由呼叫失敗時 graceful fallback
- **WHEN** `/api/route` 呼叫失敗（網路錯誤等）
- **THEN** useChat 以使用者當前選擇的模型繼續送出，不阻擋對話

### Requirement: UI 顯示 auto-routing 結果
當 auto-routing 生效時，介面 SHALL 顯示「AI 選擇：<模型名稱>」的 badge 或文字提示，讓使用者知道實際使用的模型。

#### Scenario: Auto-routing 顯示選擇結果
- **WHEN** auto-routing 呼叫成功，取得推薦模型
- **THEN** InputBar 或 ChatArea 顯示「AI 選擇：<modelId>」提示

#### Scenario: Auto-routing 關閉時不顯示
- **WHEN** `autoRouting` 為 false
- **THEN** 不顯示任何 auto-routing 相關 UI
