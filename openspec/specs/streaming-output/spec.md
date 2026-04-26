# Capability: Streaming Output

## Purpose

實現 AI 回覆的逐字串流顯示。後端透過 SSE（Server-Sent Events）協定將 LLM 的 delta token 轉送給前端，前端使用 `fetch` + `ReadableStream` 接收並即時渲染，使使用者能看到 AI「打字」的效果，而非等待完整回覆後才一次顯示。

---

## Requirements

### Requirement: 後端建立 SSE 串流端點

後端提供 `POST /api/chat/stream` 端點，接收請求後設定 SSE headers，並將上游 LLM API 的 streaming 回覆逐一轉送給客戶端。

#### Scenario: 成功開始串流

GIVEN 前端送出合法的 POST 請求至 `/api/chat/stream`
WHEN 後端接收到請求並成功連接 LLM API
THEN 回應 headers 設定為 `Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive`
AND 每個 token 以 `data: {"delta":"<token>"}\n\n` 格式逐一送出
AND 串流結束時送出 `data: [DONE]\n\n` 後關閉連線

#### Scenario: 無效請求（缺少必要欄位）

GIVEN 前端送出的請求缺少 `model` 或 `messages` 欄位
WHEN 後端進行參數驗證
THEN 回應 HTTP 400 狀態碼
AND 回應 body 包含 `{ "error": "<描述>" }`
AND 不建立 SSE 串流

#### Scenario: 上游 LLM API 發生錯誤

GIVEN SSE 串流已開始（headers 已送出）
WHEN 上游 LLM API 回傳錯誤或逾時
THEN 後端送出 `data: {"error":"<錯誤描述>"}\n\n`
AND 接著送出 `data: [DONE]\n\n` 關閉串流
AND 不拋出未捕獲的例外

#### Scenario: 客戶端提前斷線

GIVEN 串流正在進行中
WHEN 客戶端關閉連線（`req` 觸發 `close` 事件）
THEN 後端停止向客戶端寫入資料
AND 不發生寫入已關閉 socket 的錯誤

---

### Requirement: 前端接收並即時渲染串流

前端使用 `fetch` 發送 POST 請求，透過 `response.body.getReader()` 讀取 SSE 資料流，解析每個 `data:` 行並即時更新 UI。

#### Scenario: 逐字顯示 AI 回覆

GIVEN 使用者送出訊息後系統開始串流
WHEN 前端收到每個 `data: {"delta":"<token>"}` 事件
THEN 前端 dispatch `APPEND_TOKEN` action
AND `streamingContent` 狀態累積新 token
AND `StreamingBubble` 元件即時重新渲染顯示目前累積的內容
AND 使用者可在串流過程中看到文字逐漸出現

#### Scenario: 串流結束後轉為完整訊息

GIVEN 前端收到 `data: [DONE]` 事件
WHEN 前端 dispatch `FINISH_STREAM` action
THEN `streamingContent` 的內容被移至 `messages` 陣列中成為一則 assistant 訊息
AND `StreamingBubble` 消失，改由 `MessageBubble` 顯示完整訊息
AND `isStreaming` 狀態重設為 `false`
AND Send 按鈕恢復可點擊狀態

#### Scenario: 串流中的錯誤處理

GIVEN 前端收到 `data: {"error":"<錯誤描述>"}` 事件
WHEN 前端 dispatch `STREAM_ERROR` action
THEN `error` 狀態更新為錯誤描述
AND 錯誤訊息顯示在輸入框上方的 Error Banner 中
AND `isStreaming` 重設為 `false`
AND `streamingContent` 清空（不寫入 messages）

#### Scenario: 串流期間 UI 狀態

GIVEN `isStreaming === true`
WHEN 串流正在進行
THEN Send 按鈕顯示「…」並處於 disabled 狀態
AND 輸入框處於 disabled 狀態
AND 模型選單處於 disabled 狀態
AND 頁面底部顯示帶有閃爍游標（`|`）的 `StreamingBubble`

---

### Requirement: SSE 解析健壯性

前端的 SSE 解析邏輯能正確處理網路分片（partial chunks），不因 chunk 邊界切斷 SSE 行而解析錯誤。

#### Scenario: 處理跨 chunk 的 SSE 行

GIVEN 網路傳輸導致一個 SSE 行被切成兩個 `ReadableStream` chunk
WHEN 前端的 TextDecoder + buffer 邏輯執行
THEN 不完整的行被保留在 buffer 中
AND 等下一個 chunk 抵達後拼接完整再解析
AND 最終解析結果與完整傳輸時相同
