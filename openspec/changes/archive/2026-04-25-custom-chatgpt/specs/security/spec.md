# Capability: Security

## Purpose

確保 Groq 與 NVIDIA NIM 的 API Key 不暴露給瀏覽器端。所有 LLM API 呼叫必須經由 Express 後端代理，API Key 嚴格存放於後端的 `.env` 環境變數中，並透過 `.gitignore` 確保金鑰不被意外提交至版本控制系統。

---

## Requirements

### Requirement: API Key 僅存於後端環境變數

API Key 只存在於後端的 `.env` 檔案中，不出現在任何前端程式碼、回應 body、或 HTTP headers 中。

#### Scenario: 瀏覽器無法取得 API Key

GIVEN 使用者開啟 DevTools 的 Network 面板
WHEN 使用者送出訊息並觀察所有網路請求
THEN 前端發出的請求中不包含 `GROQ_API_KEY` 或 `NVIDIA_API_KEY`
AND 後端的 SSE 回應 stream 中不包含 API Key
AND 前端的 JavaScript 程式碼（含 bundle）中不包含 API Key 字串

#### Scenario: 後端啟動時驗證環境變數

GIVEN 後端啟動時執行 `config.js`
WHEN `GROQ_API_KEY` 或 `NVIDIA_API_KEY` 任一未設定
THEN 後端輸出錯誤訊息至 stderr
AND 後端以非零狀態碼（`process.exit(1)`）終止
AND 不啟動 HTTP server（防止以無金鑰狀態接受請求）

---

### Requirement: .env 檔案不被版本控制追蹤

確保 `.env` 檔案不會被 `git add` 或 `git commit` 意外提交。

#### Scenario: .gitignore 包含 .env 規則

GIVEN 專案根目錄存在 `.gitignore` 檔案
WHEN 開發者執行 `git status` 或 `git add .`
THEN `backend/.env` 不出現在 staged 檔案清單中
AND git 將 `backend/.env` 視為 untracked 並忽略

#### Scenario: 提供 .env.example 範本

GIVEN 其他開發者 clone 此專案
WHEN 開發者查看 `backend/` 目錄
THEN 存在 `backend/.env.example` 檔案
AND `.env.example` 包含所有必要的環境變數名稱（`GROQ_API_KEY`、`NVIDIA_API_KEY`、`PORT`）
AND `.env.example` 的值為佔位符文字，不含真實金鑰

---

### Requirement: 前端透過後端代理呼叫 LLM

前端所有 LLM 相關請求均發至同一 origin 的 `/api/chat/stream`，不直接呼叫 Groq 或 NVIDIA NIM 的 API 端點。

#### Scenario: 前端僅呼叫本地後端端點

GIVEN 使用者送出訊息
WHEN 前端的 `useChat.js` 執行網路請求
THEN 請求目標為 `/api/chat/stream`（相對路徑，透過 Vite proxy 或 Docker 網路轉發）
AND 請求中不包含任何外部 LLM API URL（如 `api.groq.com` 或 `integrate.api.nvidia.com`）

#### Scenario: 後端 CORS 設定

GIVEN 前後端部署在不同 port（開發時 5173 vs 3001）
WHEN 前端向後端送出跨域請求
THEN 後端的 `cors` middleware 允許請求通過
AND 前端正常取得回應（無 CORS 錯誤）
