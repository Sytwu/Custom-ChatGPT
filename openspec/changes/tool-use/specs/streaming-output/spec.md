## ADDED Requirements

### Requirement: SSE 工具呼叫狀態事件格式
除了現有的 `{"delta":"..."}` 事件外，SSE stream SHALL 支援兩種新事件格式，用於傳遞工具呼叫進度。

#### Scenario: 工具呼叫開始事件
- **WHEN** 後端即將執行工具
- **THEN** 推送 `data: {"toolCall":{"name":"<tool_name>","input":{...}}}\n\n`，前端據此顯示 loading 狀態

#### Scenario: 工具結果事件
- **WHEN** 工具執行完成
- **THEN** 推送 `data: {"toolResult":{"name":"<tool_name>","output":"<result>"}}\n\n`，前端據此更新顯示

#### Scenario: 現有 delta 事件不受影響
- **WHEN** LLM 串流最終回覆 token
- **THEN** 仍以 `data: {"delta":"..."}\n\n` 格式推送，前端現有邏輯不變
