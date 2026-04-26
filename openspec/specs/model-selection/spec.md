# Capability: Model Selection

## Purpose

提供使用者一個下拉選單，可在 Groq 旗下的多個 LLM 模型之間自由切換。模型清單由後端動態提供（見 dynamic-model-list capability），切換後的新模型會立即套用至下一則送出的訊息，無需重新整理頁面。Settings 額外提供 auto-routing 開關，可由系統自動選擇模型（見 auto-model-routing capability）。

---

## Requirements

### Requirement: 顯示動態 Groq 模型清單

使用者開啟應用程式時，可看到一個下拉選單，其中顯示從 Groq API 動態載入的可用模型。載入期間顯示 loading 狀態；載入失敗時 fallback 到靜態精簡清單。

#### Scenario: 動態載入模型清單成功

- **WHEN** 頁面載入，ModelSelector mount
- **THEN** 下拉選單顯示從 `/api/models` 取得的 Groq 可用模型

#### Scenario: 模型清單載入失敗 fallback

- **WHEN** `/api/models` 呼叫失敗
- **THEN** 下拉選單顯示靜態 fallback 模型清單，UI 可正常使用

#### Scenario: 載入預設模型

GIVEN 使用者首次進入應用程式
WHEN 頁面載入完成
THEN 下拉選單顯示預設模型（`llama-3.3-70b-versatile`）
AND 每個模型以友善的顯示名稱呈現（非原始 model ID）

---

### Requirement: 切換模型

使用者可選擇不同模型，選擇後立即生效，下一則訊息將使用新模型。

#### Scenario: 選擇新模型

GIVEN 使用者已選擇某個模型
WHEN 使用者從下拉選單選擇另一個模型
THEN 全域狀態中的 `model` 更新為新選擇的 model ID
AND 下拉選單顯示新選擇的模型名稱
AND 現有對話歷史不受影響（不清除）

#### Scenario: Streaming 中禁止切換

GIVEN 系統正在串流 AI 回覆（`isStreaming === true`）
WHEN 使用者嘗試操作下拉選單
THEN 選單處於 disabled 狀態，無法切換
AND 串流完成後選單恢復可操作狀態

---

### Requirement: 後端使用 Groq SDK 處理請求

後端統一以 Groq SDK 處理 chat 請求，使用 `GROQ_API_KEY`（或 request body 帶入的 key）認證。

#### Scenario: 路由至 Groq

GIVEN 前端送出的 model ID 為 Groq 支援的任一模型（如 `llama-3.3-70b-versatile`、`meta-llama/llama-4-scout-17b-16e-instruct`）
WHEN 後端的 `llm.js` 接收請求
THEN 請求被路由至 Groq SDK
AND 使用 `GROQ_API_KEY`（或 client 提供的 key）進行認證

---

### Requirement: Auto-routing 開關

Settings 面板 SHALL 提供 auto-routing 開關（Toggle），預設為關閉。狀態 SHALL 持久化至 localStorage。

#### Scenario: 開啟 auto-routing

- **WHEN** 使用者在 Settings 開啟 auto-routing toggle
- **THEN** `autoRouting: true` 儲存至 state，後續送出訊息時自動路由
