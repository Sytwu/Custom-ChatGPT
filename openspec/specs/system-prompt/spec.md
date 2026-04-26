# Capability: System Prompt

## Purpose

提供一個文字輸入區讓使用者隨時編輯 System Prompt，設定 AI 的角色、語氣或任務限制。System Prompt 僅在後端被注入到對話最前端，前端的 messages 陣列不儲存 system 角色的訊息。

---

## Requirements

### Requirement: 顯示 System Prompt 輸入區

使用者在 Sidebar 中可看到一個多行文字輸入框，用於輸入自訂 System Prompt。

#### Scenario: 空白預設狀態

GIVEN 使用者首次進入應用程式
WHEN 頁面載入完成
THEN System Prompt 輸入框為空白
AND placeholder 文字顯示提示（例如：「You are a helpful assistant.」）

#### Scenario: 輸入 System Prompt

GIVEN 使用者點擊 System Prompt 輸入框
WHEN 使用者輸入文字
THEN 全域狀態中的 `systemPrompt` 即時更新
AND 輸入框顯示使用者輸入的內容

---

### Requirement: System Prompt 套用至請求

每次送出訊息時，System Prompt 由後端注入至對話開頭，作為 `role: "system"` 的訊息。

#### Scenario: 有 System Prompt 時的請求結構

GIVEN 使用者已輸入 System Prompt 為「You are a pirate.」
WHEN 使用者送出訊息
THEN 後端接收到 `systemPrompt: "You are a pirate."`
AND 後端將 `{ role: "system", content: "You are a pirate." }` 插入 messages 陣列最前端
AND LLM API 收到的 messages 陣列第一筆為 system 訊息

#### Scenario: System Prompt 為空時的請求結構

GIVEN 使用者未輸入 System Prompt（欄位為空白或只有空格）
WHEN 使用者送出訊息
THEN 後端不插入 system 訊息
AND LLM API 收到的 messages 陣列直接從 user 訊息開始

#### Scenario: 中途修改 System Prompt

GIVEN 使用者已進行數輪對話
WHEN 使用者修改 System Prompt 後送出新訊息
THEN 下一則請求使用新的 System Prompt
AND 歷史訊息不受影響（不重新處理）
