## Why

目前系統同時支援 Groq 與 NVIDIA NIM 兩個 provider，但 NVIDIA 整合已不再需要，造成不必要的複雜度。此外，模型選擇完全由使用者手動決定，無法根據任務類型自動選擇最適合的模型；同時模型清單是靜態寫死的，無法反映 Groq 實際可用的模型。

## What Changes

- **BREAKING** 移除所有 NVIDIA NIM 相關程式碼（`nvidia.js` service、prefix routing、`NVIDIA_API_KEY` 環境變數、前端 `NVIDIA_PREFIXES` 陣列）
- **BREAKING** 移除 NVIDIA 模型（`nvidia/`、`meta/`、`mistralai/` 等前綴）的 UI 選項
- 新增後端 `GET /api/models` endpoint，透過 Groq API 動態回傳可用模型清單（含定期快取）
- 前端模型選單改為從 `/api/models` 動態載入，不再依賴靜態 `constants/models.js` 清單
- 新增後端 `POST /api/route` endpoint，使用輕量 Groq 模型分析使用者訊息，回傳推薦的模型 ID（例如根據任務複雜度、語言、程式碼需求等）
- 前端聊天流程在送出前先呼叫 `/api/route`，自動選擇模型（使用者仍可手動覆蓋）
- 新增 UI 指示器顯示「AI 自動選擇：<模型名稱>」，當 auto-routing 生效時

### Non-goals

- 不支援多個 API provider 並存（統一使用 Groq）
- 不做跨訊息的模型切換追蹤（每次獨立路由）
- 不做複雜的 token 計算或成本最佳化路由

## Capabilities

### New Capabilities

- `dynamic-model-list`: 後端動態從 Groq API 抓取可用模型清單，有 TTL 快取；前端從 API 載入模型選單
- `auto-model-routing`: 後端路由 endpoint 使用輕量 LLM 分析使用者訊息並推薦最適合的 Groq 模型；前端自動套用並顯示路由結果

### Modified Capabilities

- `model-selection`: 模型選單改為動態載入；新增 auto-routing 開關與路由結果顯示

## Impact

- **移除**：`backend/src/services/nvidia.js`，`backend/src/services/llm.js` 中的 NVIDIA 分派邏輯
- **新增**：`backend/src/routes/models.js`、`backend/src/routes/route.js`
- **修改**：`backend/src/services/llm.js`（純 Groq）、`backend/src/index.js`（掛載新路由）
- **修改**：`frontend/src/constants/models.js`（移除靜態清單或保留為 fallback）、`frontend/src/hooks/useChat.js`（auto-routing 邏輯）、`frontend/src/components/settings/ModelSelector.jsx`（動態載入）
- **移除**：`backend/.env.example` 中的 `NVIDIA_API_KEY`；`frontend/.env.example` 不受影響
- **依賴**：Groq SDK 已安裝（`groq-sdk`），不需新增依賴
