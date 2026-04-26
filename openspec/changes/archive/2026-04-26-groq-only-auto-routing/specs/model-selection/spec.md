## MODIFIED Requirements

### Requirement: 顯示動態 Groq 模型清單
使用者開啟應用程式時，可看到一個下拉選單，其中顯示從 Groq API 動態載入的可用模型（移除 NVIDIA NIM 分組）。載入期間顯示 loading 狀態；載入失敗時 fallback 到靜態精簡清單。

#### Scenario: 動態載入模型清單成功
- **WHEN** 頁面載入，ModelSelector mount
- **THEN** 下拉選單顯示從 `/api/models` 取得的 Groq 可用模型，無 NVIDIA NIM 分組

#### Scenario: 模型清單載入失敗 fallback
- **WHEN** `/api/models` 呼叫失敗
- **THEN** 下拉選單顯示靜態 fallback 模型清單，UI 可正常使用

## REMOVED Requirements

### Requirement: NVIDIA NIM 模型分組
**Reason**: NVIDIA NIM 整合已移除，統一使用 Groq provider
**Migration**: 使用 Groq 模型清單中對應的模型（如 `llama-3.3-70b-versatile`）

## ADDED Requirements

### Requirement: Auto-routing 開關
Settings 面板 SHALL 提供 auto-routing 開關（Toggle），預設為關閉。狀態 SHALL 持久化至 localStorage。

#### Scenario: 開啟 auto-routing
- **WHEN** 使用者在 Settings 開啟 auto-routing toggle
- **THEN** `autoRouting: true` 儲存至 state，後續送出訊息時自動路由
