## ADDED Requirements

### Requirement: 後端動態回傳可用 Groq 模型清單
後端 SHALL 提供 `GET /api/models` endpoint，呼叫 Groq API 取得可用模型清單，並在記憶體中快取 5 分鐘（TTL）。回傳的模型清單 SHALL 過濾掉非 chat 用途的模型（如 whisper 語音模型）。

#### Scenario: 首次呼叫取得模型清單
- **WHEN** 前端呼叫 `GET /api/models`，且快取尚未建立
- **THEN** 後端呼叫 Groq `client.models.list()`，過濾後回傳 `{ models: [{ id, displayName }] }`，HTTP 200，並建立快取

#### Scenario: 快取命中
- **WHEN** 前端呼叫 `GET /api/models`，且距上次呼叫未超過 5 分鐘
- **THEN** 後端直接回傳快取結果，不呼叫 Groq API

#### Scenario: Groq API 不可用時 fallback
- **WHEN** Groq API 呼叫失敗（網路錯誤或無 API key）
- **THEN** 後端回傳靜態 fallback 模型清單（至少包含 `llama-3.1-8b-instant`、`llama-3.3-70b-versatile`），HTTP 200

### Requirement: 前端動態載入模型選單
前端 ModelSelector SHALL 在元件 mount 時從 `/api/models` 載入模型清單，並在載入中期間顯示 loading 狀態。若 API 失敗，SHALL fallback 到靜態 fallback 清單，不顯示錯誤阻擋使用者。

#### Scenario: 模型清單載入成功
- **WHEN** ModelSelector 元件 mount
- **THEN** 顯示 loading，fetch `/api/models` 成功後渲染動態模型選單

#### Scenario: 模型清單載入失敗
- **WHEN** fetch `/api/models` 失敗
- **THEN** 顯示靜態 fallback 清單，UI 正常可用
