# Capability: Model Selection

## Purpose

提供使用者一個下拉選單，可在 Groq 與 NVIDIA NIM 旗下的多個 LLM 模型之間自由切換。切換後的新模型會立即套用至下一則送出的訊息，無需重新整理頁面。

---

## Requirements

### Requirement: 顯示分組模型清單

使用者開啟應用程式時，可看到一個下拉選單，其中的模型依提供商（Groq、NVIDIA NIM）分組顯示。

#### Scenario: 載入預設模型

GIVEN 使用者首次進入應用程式
WHEN 頁面載入完成
THEN 下拉選單顯示預設模型（`llama-3.3-70b-versatile`）
AND 選單內容分為「Groq」與「NVIDIA NIM」兩個群組
AND 每個模型以友善的顯示名稱呈現（非原始 model ID）

#### Scenario: 展開選單查看所有模型

GIVEN 使用者點擊下拉選單
WHEN 選單展開
THEN 使用者可看到所有可用模型，依提供商分組排列
AND Groq 群組包含：Llama 3.3 70B、Llama 3.1 8B、Mixtral 8x7B、Gemma 2 9B
AND NVIDIA NIM 群組包含：Nemotron 70B、Llama 3.1 405B、Mistral Large 2、Gemma 2 27B

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

### Requirement: 後端依模型 ID 分派請求

後端根據 model ID 的前綴，自動將請求路由至正確的 API 服務（Groq 或 NVIDIA NIM），前端無需指定提供商。

#### Scenario: 路由至 Groq

GIVEN 前端送出的 model ID 為 `llama-3.3-70b-versatile`（無廠商前綴）
WHEN 後端的 `llm.js` 判斷 model ID 前綴
THEN 請求被路由至 Groq SDK
AND 使用 `GROQ_API_KEY` 進行認證

#### Scenario: 路由至 NVIDIA NIM

GIVEN 前端送出的 model ID 帶有 `nvidia/`、`meta/` 或 `mistralai/` 等廠商前綴
WHEN 後端的 `llm.js` 判斷 model ID 前綴
THEN 請求被路由至 NVIDIA NIM 服務（OpenAI SDK + 自訂 baseURL）
AND 使用 `NVIDIA_API_KEY` 進行認證
