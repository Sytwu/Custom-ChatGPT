## ADDED Requirements

### Requirement: Python 程式碼執行
後端 `services/tools/python.js` SHALL 提供 `executePython(code)` 函式，以 `child_process.spawn` 執行 `python3 -c <code>`，設定 10 秒 timeout 與 1MB maxBuffer。回傳 `{ stdout, stderr, timedOut }` 物件。

#### Scenario: 程式碼執行成功
- **WHEN** 傳入合法 Python 程式碼（如 `print(2+2)`）
- **THEN** 回傳 `{ stdout: "4\n", stderr: "", timedOut: false }`

#### Scenario: 程式碼有語法錯誤
- **WHEN** 傳入語法錯誤的 Python 程式碼
- **THEN** 回傳 `{ stdout: "", stderr: "<error message>", timedOut: false }`

#### Scenario: 程式碼執行超時
- **WHEN** 傳入無限迴圈等長執行程式碼
- **THEN** 10 秒後強制終止，回傳 `{ stdout: "", stderr: "", timedOut: true }`

#### Scenario: Python 3 不在環境中
- **WHEN** `python3` 指令不存在
- **THEN** 回傳 `{ stdout: "", stderr: "[Python Error: python3 not found]", timedOut: false }`
