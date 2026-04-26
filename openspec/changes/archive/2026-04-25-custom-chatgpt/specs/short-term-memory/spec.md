# Capability: Short-term Memory

## Purpose

維護對話歷史並在每次請求時將歷史訊息一併送給 LLM，讓 AI 具備上下文記憶能力。同時提供兩個控制機制：（1）Toggle 開關，讓使用者決定是否帶入歷史；（2）N-turn Cut-off，限制最多送出最近 N 輪對話，避免超過 LLM 的 Context Window 上限。

---

## Requirements

### Requirement: 累積對話歷史

每次完成一輪對話（user 送出 + assistant 回覆完成）後，訊息被存入前端的 `messages` 陣列，UI 完整顯示所有歷史訊息。

#### Scenario: 歷史訊息持續累積

GIVEN 使用者已完成數輪對話
WHEN 使用者查看聊天視窗
THEN 所有歷史訊息（user 與 assistant 交替）均顯示在畫面上
AND 訊息依時間順序由上至下排列
AND `messages` 陣列包含所有完整訊息（含 id、role、content、timestamp）

---

### Requirement: Memory Toggle 開關

使用者可切換 Memory 的開啟/關閉狀態，決定送出請求時是否包含歷史訊息。

#### Scenario: 開啟 Memory（預設）

GIVEN Memory Toggle 處於開啟狀態（`memoryEnabled === true`）
WHEN 使用者送出新訊息
THEN 請求中的 `messages` 包含歷史對話紀錄（受 Cut-off 機制截斷後）
AND AI 能夠理解並回應對話上下文

#### Scenario: 關閉 Memory

GIVEN 使用者將 Memory Toggle 切換為關閉（`memoryEnabled === false`）
WHEN 使用者送出新訊息
THEN 請求中的 `messages` 僅包含本次使用者輸入的訊息（單一 user message）
AND AI 無法取得之前的對話內容
AND 前端 `messages` 陣列仍保留完整歷史（UI 顯示不變）

#### Scenario: 切換 Toggle 不清除歷史

GIVEN 使用者已累積若干對話歷史
WHEN 使用者切換 Memory Toggle（開→關 或 關→開）
THEN 聊天視窗中的歷史訊息不消失
AND 僅影響下一次送出時是否帶入歷史

---

### Requirement: N-turn Cut-off 截斷機制

當歷史訊息數量超過設定的輪數上限時，自動截斷最舊的訊息，只保留最近 N 輪（1 輪 = 1 則 user + 1 則 assistant）送給 LLM。

#### Scenario: 歷史未超過上限時不截斷

GIVEN `memoryCutoff` 設定為 10（預設）
AND 目前對話共 5 輪（10 則訊息）
WHEN 使用者送出新訊息
THEN 請求中的 `messages` 包含全部 10 則歷史訊息 + 本次 user 訊息

#### Scenario: 歷史超過上限時截斷舊訊息

GIVEN `memoryCutoff` 設定為 3
AND 目前對話已有 5 輪（10 則訊息），加上本次 user 訊息共 11 則
WHEN `applyMemoryCutoff()` 函式執行
THEN 取最後 6 則訊息（3 輪 × 2）
AND 最舊的 5 則訊息被排除於本次請求外
AND 前端 `messages` 陣列仍保留全部 11 則（UI 顯示不受影響）

#### Scenario: 調整 Cut-off 數值

GIVEN Memory Toggle 處於開啟狀態
WHEN 使用者修改 Cut-off 數字輸入框的值
THEN `memoryCutoff` 狀態立即更新
AND 提示文字顯示對應的最大訊息數（memoryCutoff × 2）
AND 下一次請求按新數值進行截斷

#### Scenario: Memory 關閉時 Cut-off 不顯示

GIVEN Memory Toggle 處於關閉狀態
WHEN 使用者查看 Memory 控制區域
THEN Cut-off 數字輸入框隱藏
AND 顯示提示文字「Memory off — only the current message is sent.」

---

### Requirement: 清除對話歷史

使用者可手動清除所有對話歷史，恢復至空白狀態。

#### Scenario: 清除對話

GIVEN 使用者已累積若干對話歷史
WHEN 使用者點擊「Clear Conversation」按鈕
THEN `messages` 陣列清空
AND `streamingContent` 清空
AND 聊天視窗顯示空白歡迎提示
AND 錯誤狀態清除

#### Scenario: Streaming 中禁止清除

GIVEN 系統正在串流 AI 回覆（`isStreaming === true`）
WHEN 使用者嘗試點擊「Clear Conversation」按鈕
THEN 按鈕處於 disabled 狀態，無法執行清除
