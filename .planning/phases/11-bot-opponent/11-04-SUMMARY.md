---
phase: 11-bot-opponent
plan: 04
subsystem: ui
tags: [bot, offline, javascript, game-loop, setTimeout]

# Dependency graph
requires:
  - phase: 11-bot-opponent
    plan: 01
    provides: driveBotTurn(gameState, botPlayerId) pure function in src/bot/botDriver.js
  - phase: 11-bot-opponent
    plan: 03
    provides: isOffline flag and offline game init in src/main.js initGamePage() scope

provides:
  - "Bot turn trigger wired into btn-end-turn click handler in src/main.js"
  - "After human ends turn in offline mode, 600ms setTimeout calls driveBotTurn then startTurn for human"
  - "End Turn button disabled during bot's 600ms window to prevent double-clicks"
  - "driveBotTurn import from ./bot/botDriver.js at top of src/main.js"

affects: [11-05-game-over-offline, offline-game-loop]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bot turn scheduling: isOffline guard + setTimeout(600) wraps synchronous driveBotTurn call"
    - "Button disable pattern: disable before async delay, re-enable inside callback after bot completes"
    - "try/catch around driveBotTurn: bot errors logged to console without crashing game page"

key-files:
  created: []
  modified:
    - src/main.js

key-decisions:
  - "Bot trigger placed at the END of the btn-end-turn handler after existing online code — online path is character-for-character identical to before this plan"
  - "isOffline && gameState.activePlayerId === 'player_2' && gameState.status !== 'FINISHED' triple-guard prevents bot trigger on online games and after game ends"
  - "try/catch wraps driveBotTurn call only — renderFromState and startTurn run unconditionally after (state is guaranteed to be valid even if bot threw, since gameState was not reassigned)"
  - "startTurn called after driveBotTurn returns because driveBotTurn already calls endTurn internally — activePlayerId is already player_1 when driveBotTurn returns"

patterns-established:
  - "Offline bot loop pattern: endTurn(human) -> startTurn(human's next draw) -> detect player_2 active -> setTimeout(driveBotTurn) -> startTurn(human again)"

requirements-completed: [BOT-04]

# Metrics
duration: 10min
completed: 2026-05-31
---

# Phase 11 Plan 04: Bot Turn Trigger Summary

**driveBotTurn wired into btn-end-turn handler: 600ms delayed bot turn fires in offline mode after human ends turn, re-renders board, then starts human's next turn automatically**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-31T00:33:00Z
- **Completed:** 2026-05-31T00:43:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- `import { driveBotTurn } from './bot/botDriver.js'` added at top of src/main.js alongside existing imports
- Bot trigger block appended inside btn-end-turn click handler — fires only when `isOffline && activePlayerId === 'player_2' && status !== 'FINISHED'`
- End Turn button disabled for the 600ms bot window; re-enabled after bot completes human's next turn start
- try/catch around driveBotTurn prevents white-screen on unexpected bot errors
- Online End Turn path (syncPush, renderFromState, handleGameOver checks) completely unaffected — zero changes to existing lines
- 661 tests passing (unchanged baseline)

## Task Commits

1. **Task 1: Import driveBotTurn and add bot-turn trigger to End Turn handler** - `2412799` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified
- `src/main.js` — Added import line + 26-line bot trigger block inside btn-end-turn handler

## Decisions Made
- Bot trigger placed after the existing `log.add('gain', ...)` at the end of the click handler so online path is zero-diff
- Triple guard (`isOffline && activePlayerId === 'player_2' && status !== 'FINISHED'`) ensures the bot block is unreachable in online mode
- `startTurn` called after `driveBotTurn` returns (not before) because `driveBotTurn` already calls `endTurn` as its last step — by the time control returns, `activePlayerId` is already `player_1` and the draw phase needs to run

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Minor: `grep -c "driveBotTurn" src/main.js` returns 3, not 2, because the `console.error('[BOT] driveBotTurn threw:', err)` in the try/catch also contains the string. The plan's acceptance criterion counted "import + call" as 2, but the try/catch catch-log is a third string match. Functionality is fully correct; the criterion was off by one due to the error message wording.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Offline bot loop is now fully functional: human plays a turn, clicks End Turn, bot plays its turn 600ms later (with `driveBotTurn`), human's next turn starts automatically
- Plan 11-05 (game-over screen for offline mode) can now trigger via `handleGameOver` which is already called inside the bot turn callback when `status === 'FINISHED'`
- The offline game can be played end-to-end: lobby checkbox → game.html?offline=true → startGame → human turn → bot turn (auto, 600ms) → human turn → ... → game over

---
*Phase: 11-bot-opponent*
*Completed: 2026-05-31*

## Self-Check: PASSED

- `src/main.js` — FOUND
- `driveBotTurn` in src/main.js — FOUND (import at line 33, call at line 542)
- `isOffline && gameState.activePlayerId === 'player_2'` guard — FOUND (line 536)
- `setTimeout` bot trigger — FOUND
- commit `2412799` — FOUND in git log
- 661 tests passing — VERIFIED
