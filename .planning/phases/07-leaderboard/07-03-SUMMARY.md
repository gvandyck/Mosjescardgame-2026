---
phase: 07-leaderboard
plan: 03
status: complete
---

## Completed

**syncManager.js** — added `_disconnectHooks` module state, `registerDisconnectLoss(roomCode, uid, opponentUid)` (registers onDisconnect hooks for self-loss via `increment(1)` + currentStreak reset; attempts opponent-win hook, which will be rejected by RTDB rules per T-07-08), and `cancelDisconnectHooks()` (cancels all registered hooks, clears array).

**main.js**:
- Updated import to include `registerDisconnectLoss` and `cancelDisconnectHooks`
- Lobby form submit now passes UID to `createRoom(name, deckId, lobbyUid)` and `joinRoom(roomCodeInput, name, deckId, lobbyUid)`
- Player_2 session storage now includes `opponentUid: opponentData.uid || null`
- `initGamePage` reads `opponentUid` from lobbyData
- Player_1: calls `registerDisconnectLoss(roomCode, user.uid, p2Data.uid)` inside `mp:player2-joined` handler
- Player_2: calls `registerDisconnectLoss(roomCode, user.uid, opponentUid)` inside initial `mp:remote-state` handler
- `handleGameOver`: calls `await cancelDisconnectHooks()` BEFORE `stopListening()`

## Known limitation

T-07-08: The opponent's win hook (`users/{opponentUid}/stats`) is rejected by RTDB rules at runtime — onDisconnect fires with the disconnecting player's auth context, which cannot write to another uid's node. Opponent win from disconnect is not credited. Full solution requires Cloud Functions (future phase).

## Verification

All 588 tests pass. No regressions.
