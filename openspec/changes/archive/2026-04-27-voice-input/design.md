## Context

Web Speech API（`window.SpeechRecognition` / `window.webkitSpeechRecognition`）是瀏覽器原生 STT，不需 API key，Chrome/Edge 支援最完整。InputBar 目前管理 textarea、附件、sticker picker 等狀態，麥克風邏輯應抽到獨立 hook 以保持 InputBar 簡潔。

## Goals / Non-Goals

**Goals:**
- 純前端實作，無後端需求
- Push-to-talk 模式：點擊開始 / 再點擊停止
- 轉錄文字 append 到現有 textarea 內容
- 不支援的瀏覽器自動隱藏麥克風按鈕

**Non-Goals:**
- 後端 Whisper STT
- 連續聆聽 / wake word
- 錄音檔儲存

## Decisions

### 1. 使用 Web Speech API，不用 Whisper

**選擇**：`window.SpeechRecognition || window.webkitSpeechRecognition`，完全前端，零成本。

**理由**：課堂專案不需要超高精度 STT；Web Speech API 在 Chrome/Edge 上足夠準確；Whisper 需後端、延遲高、需要 API key。

**替代方案**：Whisper via Groq API → 需後端路由、API key、音檔上傳，過於複雜。

### 2. 抽出 `useSpeechRecognition` hook

**選擇**：建立 `frontend/src/hooks/useSpeechRecognition.js`，封裝 `SpeechRecognition` 實例的生命週期（start/stop/onresult/onerror）。回傳 `{ isListening, transcript, isSupported, start, stop }`。

**理由**：InputBar 已相當複雜（附件、sticker、discord mode），分離關注點，hook 可獨立測試。

### 3. `interim` vs `final` 結果

**選擇**：使用 `interimResults: true`，即時顯示辨識中文字（淡色）；`onresult` 事件中的 `isFinal === true` 時才 append 到 textarea。

**理由**：即時預覽讓使用者知道辨識是否正確，提升體驗。僅 final 結果寫入 textarea 避免重複。

### 4. 語言跟隨 app 設定

**選擇**：`recognition.lang` 根據 app state `language` 設定：`zh-TW` → `"zh-TW"`，`en` → `"en-US"`。

**理由**：i18n 一致性，使用者切換語言時語音辨識也跟著切換。

### 5. Push-to-talk，不用 hold-to-talk

**選擇**：點擊麥克風按鈕開始，再次點擊（或辨識自動停止）結束。

**理由**：實作簡單；hold-to-talk 在觸控裝置上體驗較差；Web Speech API 在靜音後會自動結束，push-to-talk 符合此行為。

## Risks / Trade-offs

- **Firefox 不支援 Web Speech API** → Mitigation: `isSupported` 為 false 時隱藏麥克風按鈕，不影響其他功能
- **Chrome 需要 HTTPS 才能使用麥克風** → Mitigation: 本地開發用 localhost（豁免），生產環境 Vercel/Render 均為 HTTPS
- **辨識準確度依賴 Google 伺服器**（Chrome 的 Web Speech API 後端是 Google）→ 用戶知情，無法控制
- **interim 結果閃爍** → Mitigation: 用淡色/斜體顯示 interim，視覺上區分
