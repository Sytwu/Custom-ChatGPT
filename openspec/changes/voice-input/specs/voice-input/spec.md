## ADDED Requirements

### Requirement: 瀏覽器語音辨識支援檢測
系統 SHALL 在初始化時檢測瀏覽器是否支援 `SpeechRecognition` 或 `webkitSpeechRecognition`。不支援時，麥克風按鈕 SHALL 不渲染，其他功能不受影響。

#### Scenario: 支援的瀏覽器顯示麥克風按鈕
- **WHEN** 使用者以支援 Web Speech API 的瀏覽器（Chrome/Edge）開啟 app
- **THEN** InputBar 顯示麥克風按鈕（🎤）

#### Scenario: 不支援的瀏覽器不顯示按鈕
- **WHEN** 使用者以不支援 Web Speech API 的瀏覽器開啟 app
- **THEN** InputBar 不渲染麥克風按鈕，其他 UI 不受影響

### Requirement: Push-to-talk 語音輸入
使用者 SHALL 可以點擊麥克風按鈕開始錄音，再次點擊停止錄音。錄音中 SHALL 顯示動態 pulse 視覺指示。辨識完成的最終結果 SHALL append 到 textarea 現有內容後（加空格分隔）。

#### Scenario: 點擊開始錄音
- **WHEN** 使用者點擊麥克風按鈕（非錄音中狀態）
- **THEN** 開始語音辨識，麥克風按鈕顯示 pulse 動畫（錄音中狀態）

#### Scenario: 點擊停止錄音
- **WHEN** 使用者在錄音中狀態再次點擊麥克風按鈕
- **THEN** 停止語音辨識，pulse 動畫消失，回到待機狀態

#### Scenario: 辨識結果填入 textarea
- **WHEN** 語音辨識產生 `isFinal === true` 的結果
- **THEN** 辨識文字 append 到 textarea 現有內容（若有內容則在前加空格），textarea 獲得 focus

#### Scenario: Interim 結果即時顯示
- **WHEN** 語音辨識產生 interim（非 final）結果
- **THEN** 顯示淡色的即時辨識預覽（不寫入 textarea）

### Requirement: 辨識語言跟隨 App 設定
語音辨識 SHALL 使用 app 當前語言設定作為辨識語言：`language === "zh-TW"` 時使用 `"zh-TW"`，`language === "en"` 時使用 `"en-US"`。

#### Scenario: 中文模式語音辨識
- **WHEN** app 語言設定為 `zh-TW`，使用者開始錄音
- **THEN** `SpeechRecognition.lang` 設定為 `"zh-TW"`，辨識中文輸入

#### Scenario: 英文模式語音辨識
- **WHEN** app 語言設定為 `en`，使用者開始錄音
- **THEN** `SpeechRecognition.lang` 設定為 `"en-US"`，辨識英文輸入

### Requirement: 錄音錯誤處理
當麥克風權限被拒或辨識發生錯誤時，系統 SHALL 停止錄音狀態並顯示簡短錯誤提示，不阻擋使用者繼續使用其他功能。

#### Scenario: 麥克風權限被拒
- **WHEN** 使用者拒絕麥克風存取權限
- **THEN** 錄音狀態重置，顯示「無法存取麥克風」提示（console.warn 或 toast）

#### Scenario: 辨識逾時或無聲音
- **WHEN** 語音辨識因靜音自動停止
- **THEN** 錄音狀態重置，不顯示錯誤
