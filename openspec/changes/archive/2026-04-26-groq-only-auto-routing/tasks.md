## 1. 移除 NVIDIA NIM 相關程式碼

- [x] 1.1 刪除 `backend/src/services/nvidia.js`
- [x] 1.2 在 `backend/src/services/llm.js` 移除 NVIDIA prefix 分派邏輯，改為純 Groq 路由；移除 `openai` SDK import
- [x] 1.3 在 `backend/src/routes/chat.js` 移除所有 NVIDIA 相關的特殊處理（如有）
- [x] 1.4 在 `backend/.env.example` 移除 `NVIDIA_API_KEY` 欄位
- [x] 1.5 在 `frontend/src/hooks/useChat.js` 移除 `NVIDIA_PREFIXES` 陣列及相關邏輯
- [x] 1.6 在 `frontend/src/constants/models.js` 移除 NVIDIA NIM 模型清單，保留 Groq 模型作為 fallback

## 2. 後端：動態模型清單 API

- [x] 2.1 建立 `backend/src/routes/models.js`，實作 `GET /api/models`：呼叫 `groq.models.list()`，過濾掉 id 含 `whisper` 的模型，回傳 `{ models: [{ id, displayName }] }`
- [x] 2.2 在 `models.js` 中實作記憶體快取（儲存 `{ data, expiresAt }`），TTL 設為 5 分鐘；快取命中時直接回傳
- [x] 2.3 在 `models.js` 中實作 fallback：Groq API 失敗時回傳靜態清單（`llama-3.1-8b-instant`、`llama-3.3-70b-versatile`、`llama-3.1-70b-versatile`）
- [x] 2.4 在 `backend/src/index.js` 掛載 models router 到 `/api/models`

## 3. 後端：Auto-routing API

- [x] 3.1 建立 `backend/src/routes/route.js`，實作 `POST /api/route`：接收 `{ message, apiKey }`
- [x] 3.2 在 `route.js` 中撰寫固定 system prompt，描述 Groq 各模型適用場景（速度 vs 複雜度），指示 LLM 以 JSON `{ modelId, reason }` 回應
- [x] 3.3 在 `route.js` 中呼叫 `completeChat()` with `llama-3.1-8b-instant`，解析 JSON 回應（strip code fence 後 `JSON.parse`）
- [x] 3.4 在 `route.js` 中驗證推薦的 modelId 是否存在於 `/api/models` 的快取清單中；不存在則 fallback 到 `llama-3.1-8b-instant`
- [x] 3.5 在 `backend/src/index.js` 掛載 route router 到 `/api/route`

## 4. 前端：ModelSelector 動態載入

- [x] 4.1 在 `frontend/src/components/settings/ModelSelector.jsx` 新增 `useEffect`，mount 時 fetch `GET /api/models`，將結果存入 local state `dynamicModels`
- [x] 4.2 在 ModelSelector 中實作 loading 狀態（fetch 中顯示 disabled 選單或 spinner）
- [x] 4.3 fetch 失敗時 fallback 到 `constants/models.js` 的靜態 Groq 清單，移除 NVIDIA 分組

## 5. 前端：Auto-routing 狀態與設定

- [x] 5.1 在 `frontend/src/context/reducer.js` 的 `initialState` 新增 `autoRouting: false`
- [x] 5.2 在 `context/actions.js` 新增 `SET_AUTO_ROUTING` action type
- [x] 5.3 在 `reducer.js` 處理 `SET_AUTO_ROUTING` action，更新 `autoRouting` 狀態
- [x] 5.4 在 `frontend/src/context/AppContext.jsx` 的 localStorage 持久化邏輯中加入 `autoRouting`（存入 `ccgpt_settings`）
- [x] 5.5 在適當的 Settings 元件（`MemoryControls.jsx` 附近或新建 `RoutingSettings.jsx`）新增 auto-routing Toggle，dispatch `SET_AUTO_ROUTING`
- [x] 5.6 在 `frontend/src/i18n/translations.js` 新增 auto-routing 相關字串（zh-TW + en）

## 6. 前端：useChat 整合 auto-routing

- [x] 6.1 在 `frontend/src/hooks/useChat.js` 的 `sendMessage` 函式中，若 `autoRouting` 為 true，在送出前 await `POST /api/route`（帶 `message` 和 `apiKey`）
- [x] 6.2 路由成功時以回傳的 `modelId` 覆蓋本次請求的 model（不修改 state 中的 `model`）
- [x] 6.3 路由失敗（網路錯誤、無 key 等）時 graceful fallback，以 state 的 `model` 繼續送出，不阻擋對話
- [x] 6.4 在 `useChat.js` 中新增 `routedModel` state（字串），路由成功時設為推薦的 modelId，送出後清空

## 7. 前端：UI 顯示路由結果

- [x] 7.1 在 `frontend/src/components/chat/InputBar.jsx`（或 `ChatArea.jsx`）接收 `routedModel` prop，當其非空時顯示「AI 選擇：<modelId>」badge
- [x] 7.2 在 `frontend/src/styles.css` 新增 `.routed-model-badge` 樣式（小字、淡色、與輸入框對齊）
- [x] 7.3 在 `translations.js` 新增 `routedModelLabel` 字串（zh-TW: `AI 選擇：`，en: `AI selected:`）

## 8. 驗證

- [x] 8.1 執行 `npm run build` 確認前端無 build 錯誤
- [x] 8.2 確認 NVIDIA 相關 import 已從所有檔案移除（`grep -r "nvidia" backend/src frontend/src`）
- [x] 8.3 手動測試：`GET /api/models` 回傳動態模型清單
- [x] 8.4 手動測試：送出訊息時，auto-routing 開啟時顯示 badge；關閉時不顯示
