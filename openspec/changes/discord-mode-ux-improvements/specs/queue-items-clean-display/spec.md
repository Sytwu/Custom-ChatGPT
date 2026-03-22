## ADDED Requirements

### Requirement: Message object stores raw queue items
When a queued set of messages is sent, the resulting user message object in state SHALL include a `queueItems: string[]` field containing the original message texts without any `[Message N]` labels.

#### Scenario: queueItems stored on dispatch
- **WHEN** `sendMessageQueue()` dispatches `ADD_USER_MESSAGE` with multiple messages
- **THEN** the message object in state has `queueItems: ["first message", "second message", ...]`

#### Scenario: Single message has null queueItems
- **WHEN** a single message is sent (not via queue)
- **THEN** `queueItems` is `null` on the message object

### Requirement: UI renders queue items without `[Message N]` labels
`DiscordMessageBubble` SHALL render `queueItems` as a clean numbered list when the field is present and non-null, without displaying `[Message N]` bracket labels.

#### Scenario: Numbered display without brackets
- **WHEN** a user message bubble has `queueItems: ["I'm broke", "don't know how to deal with it"]`
- **THEN** the bubble renders: `1. I'm broke` and `2. don't know how to deal with it` (or similar clean format), NOT `[Message 1] I'm broke`

#### Scenario: Backwards compatibility — no queueItems
- **WHEN** a message object has `queueItems: null` (single message or legacy message)
- **THEN** the bubble renders `message.content` directly (existing behaviour unchanged)

### Requirement: API payload uses `[Message N]` format
`apiContent()` in `reducer.js` SHALL format the API content as `[Message 1] text\n\n[Message 2] text` when `queueItems` is present, so the LLM receives structured multi-message context.

#### Scenario: API content formatted with labels
- **WHEN** `apiContent()` is called on a message with `queueItems: ["msg1", "msg2"]`
- **THEN** it returns `[Message 1] msg1\n\n[Message 2] msg2` (for multi-item) or the plain text (for single-item)

#### Scenario: Legacy messages unaffected
- **WHEN** `apiContent()` is called on a message with `queueItems: null`
- **THEN** it returns the existing formatted content (attachments, image arrays, etc.) unchanged
