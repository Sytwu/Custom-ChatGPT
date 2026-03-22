## Context

Discord Mode (Phase 2) introduced sticker packs, a multi-message queue, and AI split-response parsing. Three UX issues emerged in testing:

1. The sticker picker panel is rendered inside `.input-bar` which has `overflow: hidden`, causing it to clip or be invisible when toggled.
2. The `+` button for adding to the queue is non-intuitive — the natural gesture is pressing Enter.
3. When a queued set of messages is sent, the user's own bubble shows `[Message 1] text\n\n[Message 2] text` — implementation noise that should never be user-visible.

All changes are frontend-only, Discord-mode-gated, and non-breaking for existing conversations.

## Goals / Non-Goals

**Goals:**
- Floating sticker picker with fixed height and internal scroll, unaffected by parent `overflow`
- Enter key enqueues text in Discord mode; Shift+Enter still inserts newline
- User message bubble shows clean numbered list when `queueItems` present; `[Message N]` format only appears in API payload
- No regression to normal (non-Discord) mode

**Non-Goals:**
- Sticker description editing or content changes
- Server-side changes
- Changes to `---SPLIT---` parsing logic
- Drag-to-reorder queue items

## Decisions

### D1: Sticker picker positioning — `position: fixed` vs portal vs sibling above `input-row`

**Decision**: Use `position: fixed` with coordinates calculated relative to the sticker button's `getBoundingClientRect()`.

**Rationale**: Previous approach (sibling `div` above `input-row`) still sits inside `.input-bar`, which has `overflow: hidden`. A React portal (`ReactDOM.createPortal`) would escape all parent overflow constraints but adds complexity. `position: fixed` achieves the same escape with simpler code — just compute `bottom: window.innerHeight - buttonRect.top` and `left: buttonRect.left` on toggle.

**Alternative considered**: `ReactDOM.createPortal` to `document.body` — achieves the same result but requires a portal wrapper component. Rejected for simplicity.

### D2: Enter-to-enqueue — keyboard handler location

**Decision**: Modify `handleKeyDown` in `InputBar.jsx`. When `isDiscord` is true and key is `Enter` (without Shift), call `handleAddToQueue()` instead of `handleSend()`.

**Rationale**: The Enter→send shortcut is a global UX convention; Discord mode intentionally deviates from it. Gating the behaviour on `isDiscord` keeps normal mode unchanged.

### D3: Queue display in message bubble — `queueItems` field on message object

**Decision**: Add `queueItems: string[] | null` to the user message object stored in state. `DiscordMessageBubble` renders `queueItems` as a plain numbered list when present. `apiContent()` in `reducer.js` formats them as `[Message N] text` for the LLM.

**Rationale**: Alternatives considered:
- *Store formatted string, strip labels in UI*: fragile string parsing, breaks if AI description changes.
- *Store as separate message objects*: would require multiple API calls or complex merging; the current single-call design is simpler.
- *Store raw array (chosen)*: clean separation of display vs API concerns; consistent with how `attachmentText` is separate from `content`.

`sendMessageQueue()` in `useChat.js` passes the raw array as `queueItems` to `ADD_USER_MESSAGE` dispatch, and also builds the combined `[Message N]` string for the API separately.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `position: fixed` sticker panel misaligns on scroll or window resize | Recalculate position on each open (not cached); close picker on scroll |
| Old localStorage conversations lack `queueItems` field | `apiContent()` falls back to rendering `message.content` directly when `queueItems` is null — backwards compatible |
| Removing `+` button surprises users who already learned the old UX | Discord mode is beta; queue chip display makes the Enter-to-enqueue affordance discoverable |
| Enter-to-enqueue conflicts with mobile soft keyboard Enter | Mobile users are not the primary target; Shift+Enter workaround still works |
