## Why

Custom-ChatGPT 目前沒有使用者身份識別機制，且對話記憶僅限於單一 session 的截斷式歷史，無法跨 session 保留使用者偏好與事實。加入 Google OAuth 身份識別與跨 session 長期記憶，能讓模型在每次對話中提供更個人化的回應。

## What Changes

- **新增 Google OAuth 登入**：使用者可用 Google 帳號登入，後端核發 JWT token；未登入者保持 guest mode 可正常使用，但無法使用記憶功能
- **新增長期記憶系統**：登入後可將對話中的事實萃取為結構化記憶條目，儲存於後端；每次對話開始前自動注入記憶至 system prompt
- **新增記憶管理 UI**：Settings 面板新增「記憶」頁籤，支援查看、刪除、手動新增記憶條目
- **萃取觸發**：手動按鈕（每則 AI 訊息旁）或切換對話時自動觸發

## Capabilities

### New Capabilities
- `google-oauth`: Google OAuth 2.0 登入流程、JWT 核發與驗證、登入/登出 UI、AuthContext
- `long-term-memory`: 跨 session 事實萃取記憶，包含後端儲存 API、記憶注入 system prompt、記憶管理 UI

### Modified Capabilities
<!-- 無現有 spec 需要修改 -->

## Impact

- **後端新增**：`passport.js`, `passport-google-oauth20`, `jsonwebtoken`；新增 routes `auth.js`, `memory.js`；新增 `data/memories/` 目錄（按 userId 分檔）
- **前端新增**：`AuthContext.jsx`（管理 JWT 與登入狀態）；登入/登出 UI 元件；Settings 記憶管理頁籤；`useMemory.js` hook
- **前端修改**：`useChat.js`（對話開始前注入記憶；切換對話時觸發萃取）；每則 AI 訊息旁新增「萃取記憶」按鈕
- **環境變數新增**：`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `FRONTEND_URL`
- **不影響**：現有 LLM 串流、RAG、Discord Mode、Sticker 等功能

## Non-goals

- Email/Password 登入
- 多裝置同步（後端 JSON 檔即可，不需資料庫）
- 摘要型記憶（只做事實萃取）
- 記憶自動分類或標籤
- 多使用者管理後台
