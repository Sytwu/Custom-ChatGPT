## Context

目前 `services/llm.js` 透過 model ID prefix 分派至 Groq 或 NVIDIA NIM。NVIDIA 整合將完整移除，llm.js 改為純 Groq 路徑。模型清單目前靜態定義於 `constants/models.js`，無法反映 Groq 實際 API 的可用狀態。Auto-routing 是全新功能，需要最小化額外延遲。

## Goals / Non-Goals

**Goals:**
- 完整移除 NVIDIA NIM 相關程式碼與設定
- 後端動態抓取 Groq 可用模型清單（TTL 快取 5 分鐘）
- 新增 auto-routing：以輕量模型分析訊息，回傳推薦模型 ID
- 前端動態載入模型清單；auto-routing 結果顯示於 UI

**Non-Goals:**
- 多 provider 並存
- token 數/成本導向的路由策略
- 跨對話的路由記憶

## Decisions

### 1. 動態模型清單：後端快取，前端從 API 拉取

**選擇**：後端 `GET /api/models` 呼叫 Groq `client.models.list()`，結果在記憶體中快取 5 分鐘（TTL）。前端 ModelSelector 在 mount 時 fetch 一次，fallback 為靜態清單。

**理由**：Groq models list API 不計費，快取避免每次 render 都呼叫外部 API。靜態 fallback 確保離線或 API 失敗時 UI 不爆。

**替代方案考慮**：每次 chat 前拉取 → 增加額外延遲，不採用。

### 2. Auto-routing：後端輕量模型判斷

**選擇**：新增 `POST /api/route`，使用 `llama-3.1-8b-instant`（最快的 Groq 免費模型）以 non-streaming `completeChat()` 分析使用者最後一則訊息，回傳 `{ modelId, reason }`。System prompt 固定描述各模型的適用場景。

**理由**：路由判斷本身要快，8b 模型延遲約 200-500ms。Non-streaming 因為只需要一個 JSON 回應。後端判斷避免 API key 暴露在前端。

**替代方案考慮**：前端自己用規則判斷（if 含 code → 用 coding model）→ 不夠彈性；使用最大模型路由 → 延遲太高。

### 3. 前端 auto-routing 整合：useChat 中呼叫，可覆蓋

**選擇**：在 `useChat.js` 的 `sendMessage` 中，若 auto-routing 開啟，先 await `POST /api/route`，取得 modelId 後再送 chat request。UI 顯示「AI 選擇：<model>」badge，使用者可在 Settings 關閉 auto-routing 或手動切換模型。

**理由**：邏輯集中在 hook，不分散到元件。使用者保有最終控制權。

### 4. NVIDIA 移除策略：一次性刪除

**選擇**：直接刪除 `nvidia.js`，移除 `llm.js` 的分派邏輯，清除前端 `NVIDIA_PREFIXES`，從靜態模型清單移除 NVIDIA 模型。

**理由**：沒有需要保留相容性的理由，漸進式移除只會增加複雜度。

## Risks / Trade-offs

- **Groq API 不可用時模型清單為空** → Mitigation: fallback 到靜態精簡清單（5-10 個常見 Groq 模型）
- **Auto-routing 額外延遲 200-500ms** → Mitigation: 可關閉；顯示 loading 狀態讓使用者感知
- **路由模型可能推薦不存在的模型 ID** → Mitigation: 後端驗證推薦的 modelId 是否在可用清單中，若無則 fallback 到 `llama-3.1-8b-instant`
- **Groq models.list() 回傳的模型不一定都能用於 chat** → Mitigation: 後端過濾只保留 `owned_by: "groq"` 且 ID 不含 `whisper`（語音模型）的項目
