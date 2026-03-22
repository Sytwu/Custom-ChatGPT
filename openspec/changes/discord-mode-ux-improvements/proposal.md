## Why

Discord Mode's current UX has three friction points: the sticker picker is cramped and clips with the input bar's overflow, the multi-message queue requires an explicit `+` button (counter-intuitive), and sent messages visibly show `[Message 1]` / `[Message 2]` labels that are implementation details meant only for the AI.

## What Changes

- **Sticker picker redesigned as a floating panel**: fixed height (~280px) with internal scroll, rendered above the input bar without overflow clipping
- **Queue UX simplified**: pressing Enter adds the message to the queue (visible as chips); Shift+Enter still inserts a newline; the `+` button is removed; only the Send button transmits via API
- **Hide `[Message N]` labels in UI**: queued messages are stored raw (`queueItems: string[]` on the message object) and rendered without labels; only `apiContent()` produces the `[Message N]` format for the LLM

## Capabilities

### New Capabilities
- `sticker-picker-floating`: Sticker picker rendered as a fixed-height floating panel above the input bar with internal scroll, replacing the inline panel
- `discord-queue-enter`: In Discord mode, Enter key enqueues the typed message as a chip; Send button flushes the queue to the API
- `queue-items-clean-display`: Queue messages stored as `queueItems: string[]` on the user message object; UI renders them without `[Message N]` labels; API formatting applies labels only at send time

### Modified Capabilities
<!-- None — no existing spec-level requirements are changing -->

## Impact

- `frontend/src/components/chat/InputBar.jsx` — Enter handler, remove `+` button, sticker picker mount point
- `frontend/src/components/chat/StickerPicker.jsx` — floating panel layout with internal scroll
- `frontend/src/context/reducer.js` — `ADD_USER_MESSAGE` adds `queueItems` field; `apiContent()` formats `[Message N]` when `queueItems` present
- `frontend/src/hooks/useChat.js` — `sendMessageQueue()` passes `queueItems` array to dispatch; reads it for API format
- `frontend/src/components/chat/DiscordMessageBubble.jsx` — renders `queueItems` as clean numbered list
- `frontend/src/styles.css` — floating panel CSS; remove old `sticker-picker-panel` styles

## Non-goals

- No changes to sticker content or descriptions
- No changes to non-Discord mode behaviour
- No changes to the `---SPLIT---` AI response parsing
- No server-side changes
