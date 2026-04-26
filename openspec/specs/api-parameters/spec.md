# Capability: API Parameters

## Purpose

提供 UI 控制元件讓使用者在對話前或對話中調整 LLM 的常用推論參數（Temperature、Max Tokens），參數變更後立即套用至下一則請求，無需重啟應用程式。

---

## Requirements

### Requirement: Temperature 滑桿控制

使用者可透過滑桿調整 Temperature 值（0.0 至 2.0），控制 AI 回覆的隨機程度。

#### Scenario: 顯示預設 Temperature

GIVEN 使用者首次進入應用程式
WHEN 頁面載入完成
THEN Temperature 滑桿顯示預設值 `0.7`
AND 滑桿旁顯示目前數值（精確至小數點一位）
AND 滑桿兩端分別標示「Precise (0)」與「Creative (2)」

#### Scenario: 調整 Temperature

GIVEN 使用者拖曳 Temperature 滑桿
WHEN 滑桿數值改變（步距 0.1）
THEN 全域狀態中的 `temperature` 即時更新
AND 旁邊的數值標籤同步顯示新數值
AND 下一則送出的請求使用新的 temperature 值

---

### Requirement: Max Tokens 數字輸入

使用者可透過數字輸入框設定每次回覆的最大 Token 數量，避免回覆過長或超出模型限制。

#### Scenario: 顯示預設 Max Tokens

GIVEN 使用者首次進入應用程式
WHEN 頁面載入完成
THEN Max Tokens 輸入框顯示預設值 `1024`

#### Scenario: 修改 Max Tokens

GIVEN 使用者點擊 Max Tokens 輸入框
WHEN 使用者輸入新數值（有效範圍：64 ~ 32768，步距 64）
THEN 全域狀態中的 `maxTokens` 更新為新數值
AND 下一則送出的請求使用新的 max_tokens 值

---

### Requirement: 參數傳遞至後端

每次送出訊息時，前端將目前的 temperature 與 maxTokens 包含在請求 body 中，後端直接轉送給 LLM API。

#### Scenario: 參數包含於 API 請求

GIVEN 使用者設定 temperature 為 `1.2`、max tokens 為 `512`
WHEN 使用者送出訊息
THEN 後端請求 body 包含 `"temperature": 1.2` 和 `"maxTokens": 512`
AND 後端呼叫 LLM API 時傳入 `temperature: 1.2` 與 `max_tokens: 512`
