## 1. Hook：useSpeechRecognition

- [ ] 1.1 建立 `frontend/src/hooks/useSpeechRecognition.js`：在 module 頂部偵測 `window.SpeechRecognition || window.webkitSpeechRecognition`，回傳 `isSupported: false` 若不支援
- [ ] 1.2 在 hook 中建立 `SpeechRecognition` 實例（`useRef`），設定 `continuous: false`、`interimResults: true`
- [ ] 1.3 實作 `onresult` handler：區分 interim（`isFinal === false`）與 final 結果，interim 存入 `interimTranscript` state，final 存入 `finalTranscript` state
- [ ] 1.4 實作 `onerror` handler：設 `isListening: false`，依 error type 設定 `error` state（`"not-allowed"` / 其他）
- [ ] 1.5 實作 `onend` handler：設 `isListening: false`，清空 `interimTranscript`
- [ ] 1.6 匯出 `{ isSupported, isListening, interimTranscript, finalTranscript, error, start, stop }` 介面；`start(lang)` 設定 `recognition.lang` 後呼叫 `recognition.start()`；`stop()` 呼叫 `recognition.stop()`

## 2. InputBar：麥克風按鈕整合

- [ ] 2.1 在 `frontend/src/components/chat/InputBar.jsx` import `useSpeechRecognition` hook
- [ ] 2.2 在 `InputBar` 中呼叫 hook，從 app context 取得 `language` 設定
- [ ] 2.3 新增 `useEffect`：監聽 `finalTranscript` 變化，當非空時 append 到 textarea 內容（`setText(prev => prev ? prev + " " + finalTranscript : finalTranscript)`），然後清空 `finalTranscript`（呼叫 hook 的 reset 或用 useEffect 依賴）
- [ ] 2.4 在 InputBar JSX 的按鈕列中新增麥克風按鈕，條件渲染（`isSupported` 為 true 時才顯示）：`isListening` 時顯示 pulse 動畫 class + 停止圖示，否則顯示 🎤
- [ ] 2.5 麥克風按鈕 `onClick`：`isListening` 時呼叫 `stop()`，否則呼叫 `start(language === "zh-TW" ? "zh-TW" : "en-US")`
- [ ] 2.6 在 `InputBar` 顯示 interim transcript：在 textarea 下方（或 overlay）以淡色文字顯示 `interimTranscript`（非空時顯示）
- [ ] 2.7 `error === "not-allowed"` 時以 `console.warn` 記錄；可選：顯示短暫 toast 提示（重用現有通知機制若有，否則 console 即可）

## 3. 樣式

- [ ] 3.1 在 `frontend/src/styles.css` 新增 `.mic-btn` 樣式（與現有 `.send-btn`、`.add-queue-btn` 風格一致）
- [ ] 3.2 新增 `.mic-btn.listening` 樣式：加入 pulse keyframe 動畫（`@keyframes mic-pulse`，scale + opacity 循環），顏色改為紅色系提示錄音中
- [ ] 3.3 新增 `.interim-transcript` 樣式：絕對或相對定位於 textarea 區域下方，小字、半透明、斜體

## 4. i18n

- [ ] 4.1 在 `frontend/src/i18n/translations.js` 新增語音輸入相關字串（zh-TW + en）：`micStart`（「點擊開始語音輸入」）、`micStop`（「點擊停止錄音」）、`micNotSupported`（「此瀏覽器不支援語音輸入」）

## 5. 驗證

- [ ] 5.1 執行 `npm run build` 確認無 build 錯誤
- [ ] 5.2 手動測試（Chrome）：點擊麥克風 → 授權 → 說話 → 文字填入 textarea
- [ ] 5.3 手動測試：切換語言為 English → 說英文 → 確認辨識正確
- [ ] 5.4 手動測試：在不支援瀏覽器（或 disable JS Speech API）→ 確認麥克風按鈕不顯示，其他 UI 正常
- [ ] 5.5 手動測試：錄音中 → 再次點擊 → 確認停止，pulse 消失
