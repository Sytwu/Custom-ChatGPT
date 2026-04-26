## ADDED Requirements

### Requirement: Enter key enqueues message in Discord mode
In Discord mode, pressing Enter (without Shift) SHALL add the current textarea content to the message queue as a chip, and clear the textarea. The message SHALL NOT be sent to the API at this point.

#### Scenario: Enter enqueues text
- **WHEN** the user types text in the textarea in Discord mode and presses Enter (without Shift)
- **THEN** the text is added to the queue as a numbered chip and the textarea is cleared

#### Scenario: Shift+Enter still inserts newline
- **WHEN** the user presses Shift+Enter in Discord mode
- **THEN** a newline is inserted into the textarea (no enqueue)

#### Scenario: Enter on empty textarea does nothing
- **WHEN** the textarea is empty and the user presses Enter in Discord mode
- **THEN** nothing happens

### Requirement: Send button transmits the full queue
In Discord mode, the Send button (or Send All button when queue is non-empty) SHALL transmit all queued messages plus any current textarea text to the API in a single request.

#### Scenario: Send flushes queue and current text
- **WHEN** the queue contains messages and the user clicks Send (or Send All)
- **THEN** all queued messages plus the current textarea text (if non-empty) are sent as one API request, and the queue and textarea are cleared

#### Scenario: Send with empty queue sends current text only
- **WHEN** the queue is empty and the user clicks Send
- **THEN** only the current textarea text is sent (normal Discord single-message send)

### Requirement: `+` button is removed
The explicit `+` (add to queue) button SHALL be removed from the Discord mode input bar.

#### Scenario: No `+` button visible
- **WHEN** viewing a Discord mode conversation
- **THEN** no `+` button is present in the input row
