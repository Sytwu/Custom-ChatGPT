## ADDED Requirements

### Requirement: 記憶 CRUD API
後端 SHALL 提供記憶管理 API，所有 endpoints 需通過 JWT 驗證。記憶儲存於 `backend/data/memories/<userId>.json`，格式為 JSON 陣列，每條記憶結構為 `{ id, content, createdAt, source }`。

#### Scenario: 取得記憶列表
- **WHEN** 已登入使用者呼叫 `GET /api/memory`（帶 JWT）
- **THEN** 回傳該使用者所有記憶條目陣列，HTTP 200

#### Scenario: 手動新增記憶
- **WHEN** 已登入使用者呼叫 `POST /api/memory`，body 含 `{ content }` 字串
- **THEN** 建立新記憶條目（`source: "manual"`），回傳新條目，HTTP 201

#### Scenario: 刪除記憶
- **WHEN** 已登入使用者呼叫 `DELETE /api/memory/:id`
- **THEN** 從檔案移除對應條目，回傳 HTTP 204

#### Scenario: 未登入存取記憶 API
- **WHEN** 未帶 JWT 呼叫任何 `/api/memory` endpoint
- **THEN** 回傳 `401 Unauthorized`

---

### Requirement: LLM 記憶萃取 API
後端 SHALL 提供 `POST /api/memory/extract` endpoint，接收對話訊息陣列，呼叫 LLM 萃取事實並儲存。

#### Scenario: 成功萃取並儲存記憶
- **WHEN** 已登入使用者呼叫 `POST /api/memory/extract`，body 含 `{ messages, model, apiKey }`
- **THEN** 後端用固定萃取 system prompt 呼叫 `completeChat()`，解析 LLM 回傳的 JSON 陣列，將新條目（`source: "auto"`）附加至使用者記憶檔，回傳新增的條目陣列，HTTP 200

#### Scenario: LLM 回傳無事實
- **WHEN** LLM 判斷對話無值得記憶的事實，回傳空陣列 `[]`
- **THEN** 不新增任何記憶，回傳空陣列，HTTP 200

#### Scenario: LLM 回傳格式異常
- **WHEN** LLM 回傳非 JSON 格式或解析失敗
- **THEN** 後端靜默失敗，回傳 `{ extracted: [], error: "parse_failed" }`，HTTP 200（不拋 500）

---

### Requirement: 記憶注入至 System Prompt
前端 SHALL 在每次送出 chat request 前，將使用者記憶注入 system prompt。

#### Scenario: 已登入且有記憶時注入
- **WHEN** 已登入使用者有至少一條記憶，且即將送出 chat request
- **THEN** system prompt 前加入記憶區塊：
  ```
  [使用者記憶]
  - <記憶條目 1>
  - <記憶條目 2>

  <原本的 system prompt>
  ```

#### Scenario: 未登入或無記憶時不注入
- **WHEN** 使用者未登入，或已登入但無任何記憶條目
- **THEN** system prompt 不做任何修改

---

### Requirement: 手動萃取觸發
使用者 SHALL 可在每則 AI 訊息旁點擊按鈕手動觸發記憶萃取。

#### Scenario: 手動萃取成功
- **WHEN** 已登入使用者點擊 AI 訊息旁的「萃取記憶」按鈕
- **THEN** 前端呼叫 `POST /api/memory/extract`，萃取完成後顯示 toast 通知（成功：「已新增 N 條記憶」；無新記憶：「未找到新記憶」）

#### Scenario: Guest 使用者看不到萃取按鈕
- **WHEN** 使用者未登入
- **THEN** AI 訊息旁不顯示「萃取記憶」按鈕

---

### Requirement: 切換對話時自動萃取
系統 SHALL 在使用者切換對話時，自動對前一個對話觸發記憶萃取（靜默，不顯示通知）。

#### Scenario: 切換對話觸發自動萃取
- **WHEN** 已登入使用者切換到其他對話，且前一對話有至少一則 AI 訊息
- **THEN** 前端在背景呼叫 `POST /api/memory/extract`，不阻塞 UI，不顯示通知

#### Scenario: Guest 切換對話不觸發
- **WHEN** 未登入使用者切換對話
- **THEN** 不發出任何記憶相關請求

---

### Requirement: 記憶管理 UI
前端 Settings 面板 SHALL 新增「記憶」頁籤，供已登入使用者查看、新增、刪除記憶條目。

#### Scenario: 查看記憶列表
- **WHEN** 已登入使用者開啟 Settings → 記憶頁籤
- **THEN** 顯示所有記憶條目，每條顯示內容、來源（手動/自動）、建立時間

#### Scenario: 手動新增記憶
- **WHEN** 使用者在記憶頁籤輸入文字並點擊「新增」
- **THEN** 呼叫 `POST /api/memory`，新條目即時出現於列表

#### Scenario: 刪除記憶
- **WHEN** 使用者點擊某條記憶旁的刪除按鈕
- **THEN** 呼叫 `DELETE /api/memory/:id`，該條目從列表移除

#### Scenario: 未登入使用者開啟記憶頁籤
- **WHEN** 未登入使用者開啟 Settings → 記憶頁籤
- **THEN** 顯示「請先登入以使用記憶功能」提示，不顯示記憶列表

---

### Requirement: 記憶條目上限
系統 SHALL 限制每位使用者最多 50 條記憶，超過時提示使用者。

#### Scenario: 新增記憶超過上限
- **WHEN** 使用者（或萃取）嘗試新增記憶，但已有 50 條
- **THEN** 不新增記憶，手動操作時提示「記憶已達上限（50 條），請刪除舊記憶後再試」；自動萃取時靜默忽略
