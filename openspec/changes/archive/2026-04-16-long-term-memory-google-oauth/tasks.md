## 1. 後端：依賴套件與環境設定

- [x] 1.1 在 `backend/package.json` 新增 `passport`, `passport-google-oauth20`, `jsonwebtoken` 依賴，執行 `npm install`
- [x] 1.2 在 `backend/.env.example` 新增 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `FRONTEND_URL` 佔位符與說明
- [x] 1.3 在 `backend/src/` 建立 `middleware/auth.js`，實作 JWT 驗證 middleware（驗證 `Authorization: Bearer <token>`，解析後注入 `req.user`，失敗回傳 401）

## 2. 後端：Google OAuth 路由

- [x] 2.1 在 `backend/src/routes/` 建立 `auth.js`，設定 `GET /api/auth/google` 啟動 passport Google OAuth 流程
- [x] 2.2 在 `backend/src/routes/auth.js` 新增 `GET /api/auth/google/callback`：接收授權碼，核發 JWT（payload: `{ userId, email, displayName }`，7 天 TTL），302 redirect 到 `FRONTEND_URL/?token=<jwt>`
- [x] 2.3 在 `backend/src/app.js`（或主 server 檔）初始化 passport 並掛載 `auth.js` 路由到 `/api/auth`

## 3. 後端：記憶 CRUD API

- [x] 3.1 建立 `backend/data/` 目錄，並在 `.gitignore` 加入 `backend/data/memories/`（避免記憶資料進版控）
- [x] 3.2 建立 `backend/src/services/memoryStore.js`：實作 `getMemories(userId)`、`saveMemories(userId, memories)` 函式（讀寫 `data/memories/<userId>.json`，若檔案不存在回傳空陣列）
- [x] 3.3 建立 `backend/src/routes/memory.js`，掛載以下 endpoints（所有 routes 套用 `authMiddleware`）：
  - `GET /api/memory` → 回傳使用者記憶陣列
  - `POST /api/memory` → 新增手動記憶條目（`source: "manual"`，上限 50 條）
  - `DELETE /api/memory/:id` → 刪除指定記憶
- [x] 3.4 在主 server 檔掛載 `memory.js` 路由到 `/api/memory`

## 4. 後端：記憶萃取 API

- [x] 4.1 在 `backend/src/routes/memory.js` 新增 `POST /api/memory/extract`：接收 `{ messages, model, apiKey }`，以固定萃取 system prompt 呼叫 `services/llm.js` 的 `completeChat()`
- [x] 4.2 實作萃取結果解析：strip markdown code fence 後 `JSON.parse()`，catch 解析失敗回傳 `{ extracted: [], error: "parse_failed" }`；成功則將新條目（`source: "auto"`）附加至記憶檔（仍受 50 條上限限制）

## 5. 前端：AuthContext 與登入狀態管理

- [x] 5.1 建立 `frontend/src/context/AuthContext.jsx`：管理 `{ user, token, isLoggedIn }` 狀態；頁面載入時從 localStorage（key: `ccgpt_auth_token`）讀取 token，驗證 JWT exp 欄位是否有效
- [x] 5.2 在 `AuthContext.jsx` 實作 `login(token)` 函式（解析 JWT payload、存 localStorage、更新狀態）及 `logout()` 函式（清除 localStorage、重置狀態）
- [x] 5.3 在頁面載入時（`useEffect`）檢查 URL 是否有 `?token=` 參數，若有則呼叫 `login(token)` 並清除 URL 參數（`window.history.replaceState`）
- [x] 5.4 在 `frontend/src/main.jsx` 用 `AuthContext.Provider` 包裹 `App`（外層），使所有元件可存取 auth 狀態

## 6. 前端：登入/登出 UI

- [x] 6.1 建立 `frontend/src/components/auth/LoginButton.jsx`：顯示「使用 Google 登入」按鈕（連結到後端 `/api/auth/google`）或已登入時顯示使用者 displayName 與「登出」按鈕
- [x] 6.2 將 `LoginButton` 整合到 sidebar 底部或 header 適當位置
- [x] 6.3 在 `frontend/src/i18n/translations.js` 新增登入相關 UI 字串（`zh-TW` + `en`：「使用 Google 登入」、「登出」、「請先登入以使用記憶功能」等）

## 7. 前端：useMemory Hook

- [x] 7.1 建立 `frontend/src/hooks/useMemory.js`：封裝 `fetchMemories()`、`addMemory(content)`、`deleteMemory(id)`、`extractMemories(messages, model, apiKey)` 函式，所有請求自動帶 `Authorization: Bearer <token>` header
- [x] 7.2 在 `useMemory.js` 實作 `buildMemoryPrompt(memories)` 函式：回傳格式化的記憶區塊字串（`[使用者記憶]\n- 條目1\n- 條目2\n`），若無記憶回傳空字串

## 8. 前端：記憶注入與自動萃取

- [x] 8.1 在 `frontend/src/hooks/useChat.js` 的 system prompt 組合邏輯中，若使用者已登入且有記憶，在 system prompt 前插入 `buildMemoryPrompt()` 的結果
- [x] 8.2 在 `frontend/src/hooks/useChat.js`（或 `ChatArea.jsx` 的對話切換邏輯）中，偵測 `activeConversationId` 變更時，若使用者已登入且前一對話有 AI 訊息，在背景靜默呼叫 `extractMemories()`

## 9. 前端：手動萃取按鈕

- [x] 9.1 在 `frontend/src/components/chat/MessageBubble.jsx` 和 `DiscordMessageBubble.jsx` 的 assistant 訊息 hover 操作區，新增「萃取記憶」按鈕（僅登入使用者可見）
- [x] 9.2 實作按鈕點擊邏輯：呼叫 `extractMemories()`，完成後顯示 toast 通知（「已新增 N 條記憶」或「未找到新記憶」）
- [x] 9.3 在 `translations.js` 新增「萃取記憶」、「已新增 N 條記憶」、「未找到新記憶」字串

## 10. 前端：記憶管理 Settings 頁籤

- [x] 10.1 在 `frontend/src/components/settings/` 建立 `MemorySettings.jsx`：顯示記憶列表（每條顯示 content、source badge、createdAt）及刪除按鈕；未登入時顯示提示
- [x] 10.2 在 `MemorySettings.jsx` 新增手動輸入欄位與「新增記憶」按鈕，呼叫 `addMemory()`
- [x] 10.3 在現有 Settings 面板（確認入口元件路徑）新增「記憶」頁籤，渲染 `MemorySettings`
- [x] 10.4 在 `translations.js` 新增記憶管理相關 UI 字串（「記憶」、「來源：手動/自動」、「記憶已達上限」等）

## 11. 部署設定更新

- [x] 11.1 更新 `render.yaml`（或 Render 設定說明文件）提示需設定 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `FRONTEND_URL` 環境變數
- [x] 11.2 在 `DEPLOY.md` 新增 Google OAuth 應用申請步驟（Google Cloud Console → 建立 OAuth 2.0 Client → 設定 Authorized redirect URI 為 `https://<render-url>/api/auth/google/callback`）
