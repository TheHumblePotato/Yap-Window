Typing indicators

Overview
--------
This change adds "typing" indicators to the chat UI. When a user is actively typing in a channel, their client writes a small presence entry in the realtime database at `Typing/<channel>/<user>`; other clients listen for changes at `Typing/<channel>` and show a typing indicator UI while one or more users are typing.

Where the indicator appears
---------------------------
- Directly above the message input area so users can see activity near the composer.
- Pinned at the end of the message list (below the last message) so it is visible to anyone looking at the conversation history.

How it works (step-by-step)
---------------------------
1. When the local user types inside the contenteditable `#message-input`, the client:
   - writes (sets) an entry to `Typing/<currentChat>/<userEmail>` with a timestamp and username.
   - resets a short timeout (2s) which will remove that entry when typing stops.
2. On send, blur, or explicit stop, the client removes its `Typing` entry immediately.
3. Each client listens to realtime changes under `Typing/<currentChat>` using Firebase's `onValue` (or equivalent). When there are entries for other users, the client:
   - builds a small message string (e.g. "Alex is typing..." or "Alex and Bay are typing...").
   - updates two DOM locations with the same indicator UI: one just above the composer and one appended to the messages area (so it appears below the last message).
4. When there are no typing entries, the indicators are hidden.

Files changed and why
---------------------
- `Code/gui.js` — adds CSS rules to style typing indicators and inserts two small placeholder containers in the DOM (one above the composer and one used inside the messages area).
- `Code/chat.js` — implements the typing presence logic: event handlers on `#message-input`, DB writes/removes, and a realtime listener to display the indicators for other users.

How to test
-----------
1. Open two browser windows (or two different accounts). Join the same channel.
2. In window A, start typing in the message input. Within a second, window B should show a typing indicator below the last message and above its input area that says "<username> is typing...".
3. Stop typing and wait ~2 seconds — the indicator should disappear.
4. Press Send in window A — the indicator should disappear immediately.
5. Check that rapid typing repeatedly does not flood the DB (writes are debounced to typing start and periodic refresh while typing).

Implementation notes and assumptions
---------------------------------
- This implementation uses the existing `database`, `ref`, `set`, and `remove` operations already used across `chat.js`.
- Users' emails are stored in Firebase paths with `.` replaced by `*` in this project; the same encoding is used for typing state keys.
- Typing entries are short-lived presence markers; they are removed on stop, on send, and also removed automatically if a client unexpectedly disconnects (you can extend this using `.info/connected` or RTDB onDisconnect handlers if desired).

Follow-ups (optional enhancements)
---------------------------------
- Use onDisconnect to ensure stale typing markers are removed if a client crashes or loses connection.
- Show avatars next to typing names.
- Add configurable timeout and animation speed.
