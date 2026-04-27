## ADDED Requirements

### Requirement: Tavily Search API 整合
後端 `services/tools/search.js` SHALL 提供 `searchWeb(query)` 函式，以 `POST https://api.tavily.com/search` 呼叫 Tavily API（帶入 `{ api_key, query, max_results: 5 }`），將回傳的 `results` 格式化為文字塊（每筆含 title、url、content 摘要）。API key 從環境變數 `TAVILY_API_KEY` 讀取。

#### Scenario: 搜尋成功
- **WHEN** 呼叫 `searchWeb("台灣天氣")`，Tavily API 正常回應
- **THEN** 回傳格式化字串，包含最多 5 筆結果（每筆含 title、url、content 摘要）

#### Scenario: API key 未設定
- **WHEN** `TAVILY_API_KEY` 未設定
- **THEN** 回傳錯誤字串 `"[Search Error: TAVILY_API_KEY not configured]"`，不拋出例外

#### Scenario: 搜尋 API 失敗
- **WHEN** Tavily API 回傳錯誤或網路失敗
- **THEN** 回傳錯誤字串 `"[Search Error: <message>]"`，不拋出例外
