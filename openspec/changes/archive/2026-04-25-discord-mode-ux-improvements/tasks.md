## 1. State — Add `queueItems` to message shape

- [x] 1.1 In `frontend/src/context/reducer.js`, update `ADD_USER_MESSAGE` case to accept `queueItems` from `action.payload` (default `null`) and store it on the message object
- [x] 1.2 In `frontend/src/context/reducer.js`, update `apiContent()` to format `[Message N] text\n\n...` when `message.queueItems` is a non-empty array (≥2 items); single-item array returns plain text; `null` falls through to existing logic

## 2. Hook — Pass `queueItems` through `sendMessageQueue`

- [x] 2.1 In `frontend/src/hooks/useChat.js`, update `sendMessageQueue(messages, attachment, replyTo)` to dispatch `ADD_USER_MESSAGE` with `queueItems: messages` (raw array) instead of the combined `[Message N]` string as `content`; keep building the combined string separately for the API `content` field

## 3. Input Bar — Enter-to-enqueue and remove `+` button

- [x] 3.1 In `frontend/src/components/chat/InputBar.jsx`, update `handleKeyDown`: when `isDiscord` is true and `e.key === "Enter"` (no Shift), call `handleAddToQueue()` instead of `handleSend()`
- [x] 3.2 In `frontend/src/components/chat/InputBar.jsx`, remove the `+` (`add-queue-btn`) button from the JSX
- [x] 3.3 In `frontend/src/styles.css`, remove the `.add-queue-btn` rule (or mark unused)

## 4. Sticker Picker — Fixed floating panel

- [x] 4.1 In `frontend/src/components/chat/InputBar.jsx`, add a `stickerBtnRef = useRef(null)` and attach it to the 🖼️ button; add `pickerPos` state (`{ bottom, left }`)
- [x] 4.2 In `frontend/src/components/chat/InputBar.jsx`, update the sticker button `onClick` to compute position via `stickerBtnRef.current.getBoundingClientRect()` and store in `pickerPos`, then toggle `showStickerPicker`
- [x] 4.3 In `frontend/src/components/chat/InputBar.jsx`, move `StickerPicker` render out of `.sticker-picker-panel` div and into a `position: fixed` wrapper div styled with `pickerPos` (bottom + left), rendered via `ReactDOM.createPortal` into `document.body`
- [x] 4.4 In `frontend/src/styles.css`, add `.sticker-picker-portal` rule: `position: fixed; z-index: 1000; width: 320px;` and update `.sticker-picker` to have `height: 280px; overflow: hidden; display: flex; flex-direction: column;` with `.sticker-grid` set to `overflow-y: auto; flex: 1`
- [x] 4.5 In `frontend/src/styles.css`, remove or clean up the old `.sticker-picker-panel` rule that used border-bottom

## 5. Discord Message Bubble — Render `queueItems` cleanly

- [x] 5.1 In `frontend/src/components/chat/DiscordMessageBubble.jsx`, update the user message render branch: if `message.queueItems` is present and non-null, render a numbered list (`1. text`, `2. text` …) instead of `message.content`

## 6. Verification

- [x] 6.1 Run `npm run build` in `frontend/` and confirm zero errors
- [ ] 6.2 Manually test: Discord mode → type message → Enter → chip appears, textarea clears; repeat; Send → all chips sent, UI shows clean numbered list
- [ ] 6.3 Manually test: click 🖼️ → floating picker appears fully visible above button; click sticker → sends; picker closes
- [ ] 6.4 Manually test: normal (non-Discord) conversation → Enter still sends immediately; no regression
