## Context

Custom-ChatGPT 是一個 stateless 的全端 AI 聊天應用，所有狀態存於前端 localStorage。目前沒有使用者身份識別，後端不持久化任何資料。

要實作跨 session 長期記憶，必須先解決 identity 問題：沒有身份識別，無法將記憶歸屬給特定使用者。Google OAuth 是最低摩擦力的 identity 方案，對使用者友好且實作成熟。

## Goals / Non-Goals

**Goals:**
- 讓使用者可用 Google 帳號登入，後端核發 JWT 作為後續 API 身份憑證
- 實作後端記憶 CRUD API，每位使用者的記憶獨立存於 `data/memories/<userId>.json`
- 在每次 chat request 前將使用者記憶注入 system prompt
- 提供手動萃取按鈕與切換對話自動萃取兩種觸發機制
- 未登入 guest 使用者可繼續正常使用，僅無法存取記憶功能

**Non-Goals:**
- Email/Password 登入
- 資料庫（SQLite、PostgreSQL 等）
- 記憶跨裝置同步（JSON 檔存於 Render 容器，重新部署會清空）
- 摘要型記憶、記憶自動分類

## Decisions

### 1. JWT 而非 Server Session

**決定**：使用無狀態 JWT（`jsonwebtoken`），不使用 express-session。

**理由**：後端部署在 Render，無持久化 session store。JWT 可直接在 Authorization header 傳遞，符合現有 stateless 架構。Token payload 存 `{ userId, email, displayName }`，TTL 7 天。

**替代方案考量**：express-session + Redis 需要額外服務，over-engineering。

---

### 2. OAuth Callback 流程

**決定**：標準 Authorization Code Flow。
```
前端 → GET /api/auth/google
     → Google 授權頁面
     → GET /api/auth/google/callback
     → 302 redirect 到前端 /?token=<jwt>
前端 → 從 URL 取出 token → 存 localStorage → 清除 URL param
```

**理由**：避免 popup 跨域問題，redirect 流程最可靠。前端用 `useEffect` 在 mount 時檢查 URL 是否有 `?token=`。

---

### 3. 記憶儲存：JSON 檔而非資料庫

**決定**：`backend/data/memories/<userId>.json`，格式：
```json
[
  { "id": "uuid", "content": "使用者叫 Alice", "createdAt": "ISO8601", "source": "auto" }
]
```

**理由**：作業範疇不需要資料庫。JSON 檔簡單直接，按 userId 分檔隔離。

**限制**：Render 免費方案容器重啟會清空 `data/` 目錄（ephemeral filesystem）。這是已知限制，在 Non-goals 範圍內。

---

### 4. 記憶萃取：呼叫 LLM 分析對話

**決定**：`POST /api/memory/extract` 接收對話訊息陣列，用目前選擇的 LLM（透過 `services/llm.js` 的 `completeChat()`）以固定 system prompt 要求回傳 JSON 格式事實陣列。

**萃取 System Prompt 範例**：
```
你是記憶萃取助理。分析以下對話，萃取關於使用者的客觀事實（姓名、職業、偏好、重要背景等）。
以 JSON 陣列回傳：[{"content": "事實描述"}]
若無值得記憶的事實，回傳空陣列 []。
```

**理由**：複用現有 `completeChat()` 函式，不需要新的 LLM 整合。

---

### 5. 記憶注入：前端在 useChat.js 處理

**決定**：記憶注入發生在前端 `useChat.js` 的 `buildSystemPrompt()` 中，在送出 chat request 前組合：
```
[使用者記憶]
- 事實 A
- 事實 B

<原本的 system prompt>
```

**理由**：後端保持 stateless（不主動拉記憶），記憶由前端在需要時 fetch 並注入，架構更清晰。

---

### 6. AuthContext 獨立於 AppContext

**決定**：新增 `AuthContext.jsx` 管理 `{ user, token, isLoggedIn }`，與現有 AppContext 分離。

**理由**：auth 狀態生命週期與 app 狀態不同；分離避免污染現有 reducer。JWT 存 localStorage key `ccgpt_auth_token`。

## Risks / Trade-offs

**[風險] Render 容器重啟清空記憶** → 短期接受此限制（作業範疇）；未來可遷移至外部儲存（如 Render Disk 或 Supabase）。

**[風險] JWT Secret 洩漏** → `JWT_SECRET` 僅存環境變數，不進版本控制；.env.example 放佔位符。

**[風險] 萃取結果非標準 JSON** → `completeChat()` 回傳可能包含 markdown code fence，需 strip 後 `JSON.parse()`，並做 try/catch 防禦。

**[Trade-off] 前端持有 JWT** → localStorage 存 JWT 有 XSS 風險，但此應用無 CSP 敏感資料需求，可接受。

**[Trade-off] 記憶注入增加 token 用量** → 每次對話多送 N 條記憶文字；記憶條目數量應有上限（建議 50 條）。

## Migration Plan

1. 後端新增 auth / memory routes，現有 routes 不受影響
2. 前端 AuthContext 包裹 AppContext，對現有元件透明
3. 未登入 guest 流程完全不變
4. 環境變數 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `FRONTEND_URL` 需在 Render 設定

## Open Questions

- 記憶條目上限：建議 50 條，超過時提示使用者刪除舊記憶，還是自動 FIFO？（建議：提示使用者手動管理）
- 萃取失敗時（LLM 回傳空或非 JSON）是否通知使用者？（建議：靜默失敗，只在手動萃取時顯示 toast 提示）
