## Why

使用者目前只能透過鍵盤輸入訊息，對於需要快速口述想法或無法打字的使用情境不便。新增語音輸入功能，讓使用者可以按住麥克風按鈕錄音，錄音完成後自動轉為文字填入輸入框，大幅提升使用體驗與效率。

## What Changes

- 在 InputBar 新增麥克風按鈕（🎤），點擊開始錄音，再次點擊停止
- 使用瀏覽器內建 Web Speech API（`SpeechRecognition`）進行即時語音轉文字（STT）
- 錄音中顯示動態視覺指示器（pulse 動畫）
- 轉錄結果自動填入輸入框（append 到現有內容，不覆蓋）
- 若瀏覽器不支援 Web Speech API，按鈕隱藏（graceful degradation）
- 支援 i18n：辨識語言跟隨 app 語言設定（zh-TW / en-US）

### Non-goals

- 不使用 Whisper 或其他後端 STT 服務（完全前端實作，無需 API key）
- 不支援錄音檔案上傳或儲存
- 不支援連續聆聽模式（push-to-talk 模式，每次手動觸發）

## Capabilities

### New Capabilities

- `voice-input`: 前端 Web Speech API 整合；麥克風按鈕 UI；錄音中視覺指示；轉錄結果填入輸入框；語言跟隨 app 設定；不支援時 graceful degradation

### Modified Capabilities

（無 spec-level 行為變更）

## Impact

- **修改**：`frontend/src/components/chat/InputBar.jsx`（新增麥克風按鈕與錄音邏輯）
- **新增**：`frontend/src/hooks/useSpeechRecognition.js`（封裝 Web Speech API）
- **修改**：`frontend/src/styles.css`（麥克風按鈕、pulse 動畫樣式）
- **修改**：`frontend/src/i18n/translations.js`（語音輸入相關 UI 字串）
- **依賴**：Web Speech API（Chrome/Edge 支援良好，Firefox 需 flag，Safari 部分支援）；無後端改動
