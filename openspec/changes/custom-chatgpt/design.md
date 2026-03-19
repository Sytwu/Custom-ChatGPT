# Design: Custom ChatGPT Web Application

## Context

本專案需要在課程作業的時間框架內完成一個具備 LLM 串接、Streaming、記憶機制的全端應用程式。無需資料庫，所有狀態保存在前端 React state。核心挑戰在於：（1）保護 API Key 不外洩、（2）正確實作 SSE Streaming 的前後端協定、（3）設計合理的 Memory Cut-off 策略。

---

## Goals

- 前端零 API Key：瀏覽器端完全感知不到 Groq 或 NVIDIA NIM 的金鑰存在
- Streaming 即時感：使用者感受到 AI「打字」，而非等待完整回覆
- 無縫切換模型：Groq 與 NVIDIA NIM 在同一介面下共存，切換不需重整頁面
- 記憶可控：使用者能精確控制送出多少輪歷史，避免 token 溢出
- 一鍵啟動：`docker compose up --build` 後即可在瀏覽器使用

## Non-Goals

- 使用者身份驗證與多使用者隔離（非本專案範疇）
- 對話持久化至資料庫（對話歷史僅存於前端 state，重整後消失）
- 支援圖片、音訊等多模態輸入
- 部署至雲端環境的 CI/CD 配置

---

## Technical Decisions

### Decision: Express 作為 API Proxy 後端

Express 是 Node.js 生態系最成熟的輕量框架，與 Groq SDK（Node.js）及 OpenAI SDK（用於 NIM）有原生相容性。以 Express 作為 Proxy，前端只需向 `/api/chat/stream` 發送請求，API Key 完全隱藏在後端的 `.env` 中。

**Rationale:** 相較於直接在前端呼叫 LLM API，Express Proxy 是唯一能真正隔離金鑰的方案。Next.js API Routes 也可行，但引入額外框架複雜度超出本作業範疇。

**Trade-offs:** 多了一個服務需要管理，但 Docker Compose 讓啟動成本降為零。

---

### Decision: SSE 協定 + `fetch` ReadableStream（非 EventSource）

後端使用 SSE 格式（`data: {...}\n\n`）輸出，因為 Express 的 `res.write()` 即可實現，不需額外套件。前端使用 `fetch` + `response.body.getReader()` 接收，而非 `EventSource`。

**Rationale:** `EventSource` 只支援 GET 請求，無法攜帶 JSON body（model、messages、temperature 等）。`fetch` + ReadableStream 支援 POST，且能在同一連線中接收所有 SSE 事件。

**Trade-offs:** `EventSource` 有自動重連機制，`fetch` 需自行處理重連，但對話串流通常短暫，重連需求極低。

**Risks & Mitigation:**
- *網路分片導致 SSE 行被切斷*：使用 buffer 機制，保留未完成的行等待下一個 chunk 拼接後再解析。
- *瀏覽器不支援 ReadableStream*：現代瀏覽器（Chrome 89+、Firefox 89+、Safari 14.5+）均已支援，可忽略。

---

### Decision: React Context + useReducer（非 Zustand 或 Redux）

全域狀態使用 React 內建的 `createContext` + `useReducer`，透過單一 `AppContext` 管理所有狀態（settings、messages、streaming、error）。

**Rationale:** 狀態形狀固定、slices 少、無需跨 Context 訂閱，Context + useReducer 的複雜度與需求完全匹配。引入 Zustand 或 Redux 會增加依賴且過度設計。

**Trade-offs:** 大量訊息時若元件訂閱粒度不夠細，可能有不必要的重渲染。但對話訊息量有 Cut-off 限制，影響可忽略。

---

### Decision: 統一 LLM 介面 — groq-sdk + openai（含自訂 baseURL）

- **Groq**：使用官方 `groq-sdk`，原生支援 `stream: true` 並回傳 async iterable。
- **NVIDIA NIM**：使用 `openai` npm 套件並設定 `baseURL: "https://integrate.api.nvidia.com/v1"`，因為 NIM 完全相容 OpenAI API 格式。

後端的 `llm.js` 依 model ID 前綴（`nvidia/`、`meta/`、`mistralai/` 等）決定路由，前端無需知道底層 API 差異。

**Rationale:** 兩個 SDK 均回傳 OpenAI-compatible 的 async iterable stream（`chunk.choices[0]?.delta?.content`），後端路由程式碼極為簡潔。避免同一功能寫兩套完全不同的實作。

---

### Decision: Memory Cut-off 在前端計算，後端被動接收

Cut-off 邏輯（`applyMemoryCutoff()`）在 `useChat.js` 中執行，計算後的精簡 messages 陣列直接包含在 POST body 中送至後端。後端不儲存任何對話歷史，純粹作為無狀態 Proxy。

**Rationale:** 無狀態後端更易於擴展（可部署多個實例），且前端本來就擁有完整歷史，在前端截斷最為自然。後端只需信任收到的 messages 陣列即可。

**Trade-offs:** 後端無法驗證 messages 是否過長，依賴前端正確實作截斷。實際超長請求會由 LLM API 回傳 4xx 錯誤，前端 error handler 會捕捉並顯示。

---

### Decision: Vite Proxy 解決開發期 CORS 問題

`vite.config.js` 設定 `/api` proxy 指向 `http://backend:3001`，Docker 網路中 `backend` 為服務名稱。開發期前端 dev server 代理所有 `/api` 請求，瀏覽器不直接接觸後端，完全無 CORS 問題。

**Rationale:** 相較於在後端設定細粒度 CORS 規則，Vite proxy 在開發期更簡單可靠，且 Docker Compose 的服務名稱解析讓容器間通訊零配置。

---

## Risk Register

| 風險 | 可能性 | 影響 | 緩解策略 |
|------|--------|------|----------|
| LLM API rate limit / quota 超限 | 中 | 高 | 後端捕捉 4xx 錯誤並透過 SSE error event 通知前端顯示 |
| Token 超過模型 Context Window | 中 | 中 | N-turn Cut-off 機制限制送出的訊息數量 |
| SSE chunk 邊界解析錯誤 | 低 | 中 | Buffer 機制拼接不完整的 SSE 行 |
| `.env` 意外提交至 Git | 低 | 極高 | `.gitignore` 加入 `backend/.env`；後端啟動時驗證金鑰存在 |
| NVIDIA NIM API 格式不相容 | 低 | 高 | 使用 OpenAI SDK + baseURL，API 層格式一致；測試階段提前驗證 |
