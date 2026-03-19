# Tasks: Custom ChatGPT Web Application

## Backend — 專案初始化

- [ ] 建立 `backend/package.json`，宣告 `"type": "module"` 與所有依賴（express、cors、dotenv、groq-sdk、openai）
- [ ] 建立 `backend/.env.example`，包含 `GROQ_API_KEY`、`NVIDIA_API_KEY`、`PORT` 三個變數
- [ ] 建立 `backend/.env`，填入真實 API Key（不提交至 Git）

## Backend — 核心服務

- [ ] 建立 `backend/src/config.js`：讀取並驗證環境變數，若缺少 API Key 則 `process.exit(1)`
- [ ] 建立 `backend/src/services/groq.js`：使用 `groq-sdk` 建立 client，實作 `streamChat()` 回傳 async iterable
- [ ] 建立 `backend/src/services/nvidia.js`：使用 `openai` SDK 加 `baseURL: "https://integrate.api.nvidia.com/v1"`，實作相同介面的 `streamChat()`
- [ ] 建立 `backend/src/services/llm.js`：依 model ID 前綴（`nvidia/`、`meta/`、`mistralai/`）分派至對應服務

## Backend — API 端點

- [ ] 建立 `backend/src/routes/chat.js`：實作 `POST /api/chat/stream` SSE 端點
  - [ ] 驗證 `model` 與 `messages` 欄位，缺少時回 HTTP 400
  - [ ] 設定 SSE headers（`Content-Type: text/event-stream` 等）
  - [ ] 將 `systemPrompt` 注入為 `{ role: "system" }` 訊息（若非空白）
  - [ ] 迭代 stream async iterable，逐一以 `data: {"delta":"..."}\n\n` 格式輸出
  - [ ] 串流結束後送出 `data: [DONE]\n\n`
  - [ ] 捕捉上游錯誤，以 `data: {"error":"..."}\n\n` 通知前端
  - [ ] 監聽 `req` 的 `close` 事件，客戶端斷線時停止寫入
- [ ] 建立 `backend/src/middleware/errorHandler.js`：全域錯誤處理，SSE 已開始時改用 SSE error event
- [ ] 建立 `backend/src/index.js`：掛載 cors、express.json、health route、chat router

## Backend — 驗證

- [ ] 執行 `curl -N -X POST http://localhost:3001/api/chat/stream` 驗證 SSE 串流正常運作
- [ ] 驗證 `GET /api/health` 回傳 `{ "status": "ok" }`

## Frontend — 專案初始化

- [ ] 建立 `frontend/package.json`，設定 Vite + React 依賴
- [ ] 建立 `frontend/vite.config.js`，設定 `/api` proxy 指向 `http://backend:3001`，並開啟 `host: "0.0.0.0"`
- [ ] 建立 `frontend/index.html`，引入 `/src/main.jsx`

## Frontend — 狀態管理

- [ ] 建立 `frontend/src/constants/models.js`：宣告 Groq 與 NVIDIA NIM 的模型清單（含分組與顯示名稱）
- [ ] 建立 `frontend/src/context/actions.js`：宣告所有 action type 常數
- [ ] 建立 `frontend/src/context/reducer.js`：實作 `initialState` 與 `reducer` 函式，涵蓋所有 action
- [ ] 建立 `frontend/src/context/AppContext.jsx`：建立 Context 與 `AppProvider` 元件
- [ ] 建立 `frontend/src/hooks/useAppContext.js`：包裝 `useContext(AppContext)`

## Frontend — 核心 Chat Hook

- [ ] 建立 `frontend/src/hooks/useChat.js`
  - [ ] 實作 `applyMemoryCutoff(messages, memoryEnabled, memoryCutoff)` 函式
  - [ ] 實作 `sendMessage(text)` 函式：dispatch `ADD_USER_MESSAGE` → 計算截斷訊息 → dispatch `START_STREAM` → 呼叫 fetch
  - [ ] 實作 SSE 讀取迴圈：TextDecoder + buffer + line 解析
  - [ ] 處理 `APPEND_TOKEN`、`FINISH_STREAM`、`STREAM_ERROR` 三種事件

## Frontend — Chat UI 元件

- [ ] 建立 `frontend/src/components/chat/MessageBubble.jsx`：顯示單則 user 或 assistant 訊息
- [ ] 建立 `frontend/src/components/chat/StreamingBubble.jsx`：顯示 `streamingContent`，含閃爍游標
- [ ] 建立 `frontend/src/components/chat/MessageList.jsx`：捲動清單，使用 `useEffect` + `useRef` 自動捲至底部
- [ ] 建立 `frontend/src/components/chat/InputBar.jsx`：多行輸入框 + Send 按鈕，支援 Enter 送出、Shift+Enter 換行、streaming 中 disable

## Frontend — Settings UI 元件

- [ ] 建立 `frontend/src/components/ui/Toggle.jsx`：可存取的 Toggle 開關（支援鍵盤 Space 切換）
- [ ] 建立 `frontend/src/components/settings/ModelSelector.jsx`：分組下拉選單，streaming 中 disabled
- [ ] 建立 `frontend/src/components/settings/SystemPromptInput.jsx`：多行文字輸入框
- [ ] 建立 `frontend/src/components/settings/TemperatureSlider.jsx`：range input，旁顯示即時數值與範圍標籤
- [ ] 建立 `frontend/src/components/settings/MaxTokensInput.jsx`：數字輸入框（64～32768）
- [ ] 建立 `frontend/src/components/settings/MemoryControls.jsx`：Toggle 開關 + Cut-off 數字輸入 + 提示文字

## Frontend — Layout 與樣式

- [ ] 建立 `frontend/src/components/layout/Sidebar.jsx`：含 collapse 按鈕，組合所有 settings 元件，包含 Clear Conversation 按鈕
- [ ] 建立 `frontend/src/components/layout/ChatArea.jsx`：組合 `MessageList` 與 `InputBar`
- [ ] 建立 `frontend/src/App.jsx`：以 `AppProvider` 包裝，組合 Header、Sidebar、ChatArea
- [ ] 建立 `frontend/src/main.jsx`：ReactDOM.createRoot 掛載 App
- [ ] 建立 `frontend/src/styles.css`：深色主題全域樣式（layout、bubble、toggle、input、scrollbar）

## 容器化

- [ ] 建立 `backend/Dockerfile`（Node 20 Alpine，`npm ci --omit=dev`）
- [ ] 建立 `frontend/Dockerfile`（Node 20 Alpine，`npm install`，`--host 0.0.0.0`）
- [ ] 建立 `docker-compose.yml`：定義 backend（port 3001，env_file）與 frontend（port 5173，depends_on）服務

## 安全性與版本控制

- [ ] 建立根目錄 `.gitignore`：加入 `backend/.env`、`node_modules/`、`frontend/dist/`

## 端對端驗證

- [ ] 執行 `docker compose up --build`，確認兩個服務正常啟動
- [ ] 開啟 `http://localhost:5173`，確認 UI 正確載入
- [ ] 送出訊息（Groq 模型），確認回覆逐字串流顯示
- [ ] 切換至 NVIDIA NIM 模型，確認串流同樣正常
- [ ] 修改 System Prompt 後送出，確認 AI 回覆風格改變
- [ ] 關閉 Memory Toggle，確認 AI 無法記住前一則訊息
- [ ] 開啟 Memory Toggle、設定 Cut-off 為 2，確認 Network 面板中 messages 最多 4 則（2 turns × 2）
- [ ] 確認 DevTools Network 中所有請求均不含 API Key
- [ ] 確認 `backend/.env` 不出現在 `git status` 的追蹤清單中
