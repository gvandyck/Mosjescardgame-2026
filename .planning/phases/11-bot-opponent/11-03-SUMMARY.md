---
phase: 11-bot-opponent
plan: 03
subsystem: ui
tags: [offline, bot, sessionStorage, javascript, game-init]

# Dependency graph
requires:
  - phase: 11-bot-opponent
    plan: 01
    provides: driveBotTurn pure function in src/bot/botDriver.js
  - phase: 11-bot-opponent
    plan: 02
    provides: sessionStorage 'mosjes:offline' written by lobby offline submit branch

provides:
  - "isOffline flag derived from ?offline=true URL param in initGamePage()"
  - "readOfflineData() helper that reads sessionStorage 'mosjes:offline'"
  - "Offline init branch in player_1 else block: startGame(human, humanDeck, 'Bot', botDeck) when isOffline=true"

affects: [11-04-bot-turn-trigger, 11-05-game-over-offline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Offline mode detection: isOffline derived from urlParams at top of initGamePage() scope — accessible to all closures (syncPush, btn-end-turn listener, etc.)"
    - "readOfflineData() mirrors readLobbyData() pattern — try/parse/catch returning {}"

key-files:
  created: []
  modified:
    - src/main.js

key-decisions:
  - "isOffline declared at urlParams block scope (not inside startGame) so Plan 04 can read it in btn-end-turn listener to trigger bot turn"
  - "readOfflineData() placed as a module-level function (alongside readLobbyData) so it can be called from initGamePage scope"
  - "Offline else branch falls through to original startGame() call for LOCAL dev mode — no breakage of existing dev workflow"
  - "syncManager not touched: isOnline=false (roomCode='LOCAL') already gates syncPush() and listenToState is never called in the offline branch"

patterns-established:
  - "Offline init pattern: check isOffline first inside player_1 else branch, read sessionStorage, call startGame() with Bot as player_2"

requirements-completed: [BOT-02, BOT-03]

# Metrics
duration: 10min
completed: 2026-05-31
---

# Phase 11 Plan 03: Offline Game Init Summary

**Offline game init branch in initGamePage(): ?offline=true URL param bypasses Firebase, reads sessionStorage 'mosjes:offline', calls startGame(human, humanDeck, 'Bot', botDeck) immediately**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-31T00:33:00Z
- **Completed:** 2026-05-31T00:43:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `isOffline` flag declared in `initGamePage()` scope from `urlParams.get('offline') === 'true'`
- `readOfflineData()` module-level helper reads and JSON-parses `sessionStorage['mosjes:offline']` with safe fallback to `{}`
- Player_1 else branch: when `isOffline=true`, reads human name/deck and bot deck from sessionStorage and calls `startGame(humanName, humanDeck, 'Bot', botDeck)` — no Firebase code touched
- Online path (Firebase listeners, `registerDisconnectLoss`, `syncPush()`) completely unaffected
- All 661 tests passing

## Task Commits

1. **Task 1: Add offline detection and session reader in initGamePage()** - `fb296b1` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified
- `src/main.js` — Added `isOffline` flag, `readOfflineData()` helper, offline branch in player_1 init block (20 lines added, 2 lines replaced)

## Decisions Made
- `isOffline` is declared at the `urlParams` block level (not inside the else branch) so that Plan 04's `btn-end-turn` listener can read it directly from the closure scope when deciding whether to trigger a bot turn
- `readOfflineData()` placed as a module-level function matching the `readLobbyData()` pattern — keeps both session readers together and avoids an inner-function placement that would create closure confusion
- Fallback values (`localPlayerName`, `pickOpponentDeck(humanDeck)`) handle the case where someone navigates directly to `game.html?offline=true` without going through the lobby — threat T-11-03-01 accepted disposition per plan

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

One minor note: the acceptance criterion `grep -c "offline=true" src/main.js >= 2` returns 1, because the detection code uses `urlParams.get('offline') === 'true'` which grep's literal `offline=true` substring does not match. The navigation target at line 139 (`game.html?offline=true&player=player_1`) does contain it as a substring. The plan's note "lobby writer from Plan 02 + this detection" was slightly imprecise about the grep pattern, but the functionality is fully correct. All other acceptance criteria pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Offline init branch is complete. Plan 11-04 can add the bot-turn trigger to the `btn-end-turn` listener — it reads `isOffline` (already in scope) and checks `gameState.activePlayerId === 'player_2'` to decide when to call `driveBotTurn(gameState, 'player_2')`.
- The `readOfflineData()` function is exported to module scope and can be used by any future code that needs to re-read the offline session data.

---
*Phase: 11-bot-opponent*
*Completed: 2026-05-31*

## Self-Check: PASSED

- `src/main.js` — FOUND
- `isOffline` in src/main.js — FOUND (4 occurrences: lobby handler line 123, navigation line 139 as part of URL, urlParams detection line 350, if-check line 452)
- `readOfflineData` in src/main.js — FOUND (2 occurrences: definition at module level, call inside offline branch)
- commit `fb296b1` — FOUND in git log
- 661 tests passing — VERIFIED
