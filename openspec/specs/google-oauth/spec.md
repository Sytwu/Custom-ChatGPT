# Google OAuth Spec

## Purpose

Define the Google OAuth 2.0 login flow, JWT-based authentication middleware, logout behavior, guest mode compatibility, and frontend auth state management for the Custom ChatGPT app.

## Requirements

### Requirement: Google OAuth 登入流程
系統 SHALL 提供 Google OAuth 2.0 Authorization Code Flow 登入。使用者點擊登入後導向 Google 授權頁面，授權完成後後端核發 JWT，以 redirect 方式將 token 帶回前端。

#### Scenario: 成功登入
- **WHEN** 使用者點擊「使用 Google 登入」按鈕
- **THEN** 瀏覽器導向 `GET /api/auth/google`，再轉向 Google 授權頁面

#### Scenario: Google 授權完成
- **WHEN** 使用者完成 Google 授權
- **THEN** 後端從 callback 取得 profile，核發 JWT（payload: `{ userId, email, displayName }`，TTL 7 天）

#### Scenario: Token 帶回前端
- **WHEN** 後端核發 JWT 後
- **THEN** 302 redirect 到 `<FRONTEND_URL>/?token=<jwt>`，前端從 URL 取出 token，存入 localStorage（key: `ccgpt_auth_token`），並清除 URL 參數

#### Scenario: 登入失敗
- **WHEN** Google 授權失敗或使用者拒絕授權
- **THEN** redirect 到前端首頁，不帶 token，前端顯示錯誤提示

---

### Requirement: JWT 驗證 Middleware
後端 SHALL 提供 `authMiddleware`，驗證 `Authorization: Bearer <token>` header 中的 JWT。

#### Scenario: 有效 Token
- **WHEN** request 帶有有效且未過期的 JWT
- **THEN** middleware 將 decoded payload 注入 `req.user`，繼續執行下一個 handler

#### Scenario: 無效或缺少 Token
- **WHEN** request 缺少 JWT 或 JWT 無效/過期
- **THEN** middleware 回傳 `401 Unauthorized`

---

### Requirement: 登出
系統 SHALL 支援前端登出操作。

#### Scenario: 使用者登出
- **WHEN** 使用者點擊「登出」
- **THEN** 前端清除 localStorage 中的 `ccgpt_auth_token`，AuthContext 重置為未登入狀態，UI 回到 guest 模式

---

### Requirement: Guest Mode 相容性
未登入使用者 SHALL 能繼續使用所有現有功能，僅無法存取記憶相關功能。

#### Scenario: Guest 使用 chat
- **WHEN** 使用者未登入並送出訊息
- **THEN** chat 正常運作，不附帶記憶注入

#### Scenario: Guest 嘗試使用記憶功能
- **WHEN** 未登入使用者嘗試操作記憶相關 UI
- **THEN** 系統提示「請先登入以使用記憶功能」

---

### Requirement: AuthContext 狀態管理
前端 SHALL 有獨立的 `AuthContext` 管理身份狀態。

#### Scenario: 頁面載入時恢復登入狀態
- **WHEN** 使用者重新載入頁面
- **THEN** AuthContext 從 localStorage 讀取 token，驗證有效性，恢復 `{ user, token, isLoggedIn }` 狀態

#### Scenario: Token 過期
- **WHEN** localStorage 中的 token 已過期（JWT exp 欄位）
- **THEN** AuthContext 清除 token，使用者回到 guest 模式
