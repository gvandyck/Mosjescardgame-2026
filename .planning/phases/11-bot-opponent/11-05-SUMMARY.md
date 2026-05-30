---
phase: 11-bot-opponent
plan: 05
subsystem: ui
tags: [bot, offline, game-over, smoke-test, javascript]

# Dependency graph
requires:
  - phase: 11-bot-opponent
    plan: 04
    provides: "driveBotTurn wired into btn-end-turn; isOffline flag in initGamePage scope"
  - phase: 11-bot-opponent
    plan: 01
    provides: "driveBotTurn pure function"

provides:
  - "renderAndCheckWin() helper in src/main.js — detects FINISHED after any human action in offline mode"
  - "All 7 human action handlers call renderAndCheckWin() instead of bare renderFromState(gameState)"
  - "Offline game can reach FINISHED via human action and correctly shows the result overlay"
  - "tests/bot/offlineGame.smoke.test.ts — 3 smoke tests drive full offline games to completion"

affects: [offline-game-complete, bot-loop-regression-safety]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "renderAndCheckWin wrapper: single function that renders then checks isOffline && FINISHED"
    - "Smoke test pattern: runOfflineGame() pure loop — no DOM, no Firebase, drives turns to FINISHED"
    - "Defensive useMosjeAbility: try/catch around ability dispatch prevents bot crash on UI-input abilities"

key-files:
  created:
    - tests/bot/offlineGame.smoke.test.ts
  modified:
    - src/main.js
    - src/engine/turnManager.js

key-decisions:
  - "renderAndCheckWin() defined inside initGamePage() alongside syncPush() — has access to isOffline, gameState, handleGameOver in closure"
  - "All 7 action handler renderFromState calls replaced — 17 total occurrences (1 def + 16 calls) including all early-exit branches in btn-general-quest"
  - "Smoke test uses .ts extension (vitest.config.ts only picks up tests/**/*.ts) — plan frontmatter said .js but that would not be collected by vitest"
  - "useMosjeAbility try/catch: bot calls Binti ability without discardedCardId which caused a throw; wrapping the dispatch returns {success:false} instead of crashing the game loop"

requirements-completed: [BOT-05]

# Metrics
duration: 15min
completed: 2026-05-31
---

# Phase 11 Plan 05: Offline Game Over — Summary

**renderAndCheckWin() added to all 7 human action handlers; offline game now shows result overlay on any winning move; 3 smoke tests confirm full game loop runs to FINISHED without crashes**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-30T22:33:00Z
- **Completed:** 2026-05-30T22:48:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

### Task 1: renderAndCheckWin helper + 7 handler replacements

- Added `renderAndCheckWin()` inside `initGamePage()` alongside `syncPush()`
- Helper: `renderFromState(gameState)` + `if (isOffline && gameState && gameState.status === 'FINISHED') handleGameOver(gameState)`
- Replaced `renderFromState(gameState)` with `renderAndCheckWin()` in all 7 handlers:
  - `btn-end-turn`: 1 call site
  - `btn-general-quest`: 9 call sites (early-exit paths + Geen Raad branches + Aad Recovery + dice roll + payment decline)
  - `handleUseAbility` (btn-use-ability): 2 call sites (West branch + generic branch)
  - `handleActivatePiecie` (btn-activate-piecie): 1 call site
  - `handleActivatePlace` (btn-activate-place): 1 call site
  - `handlePlayCard` PIECIE branch (btn-play-piecie): 1 call site
  - `handlePlayCard` PLACE branch (btn-play-place): 1 call site
- Total: 17 occurrences (`grep -c renderAndCheckWin src/main.js` = 17)
- `grep -c "isOffline.*FINISHED\|FINISHED.*isOffline" src/main.js` = 2 (helper + bot setTimeout)

### Task 2: Offline game smoke test

- Created `tests/bot/offlineGame.smoke.test.ts` with 3 tests:
  1. PHYSICAL_FORCE vs DIGITAL_CONTROL — completes within 60 turns, status=FINISHED, winnerId valid
  2. ARTISTIC_RHYTHM vs PHYSICAL_FORCE — same assertions
  3. DIGITAL_CONTROL vs ARTISTIC_RHYTHM — state integrity (activeSlots arrays preserved)
- All 3 smoke tests pass; full test suite: 664 passing (was 661)

## Task Commits

1. **Task 1: renderAndCheckWin + handler replacements** — `742f9c5`
2. **Task 2: smoke test + useMosjeAbility bug fix** — `ad01c4f`

## Files Created/Modified

- `src/main.js` — renderAndCheckWin helper + 16 handler call replacements
- `tests/bot/offlineGame.smoke.test.ts` — 3 smoke tests (new file)
- `src/engine/turnManager.js` — try/catch around ability dispatch in useMosjeAbility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used .ts extension instead of .js for smoke test**
- **Found during:** Task 2 setup
- **Issue:** `vitest.config.ts` `include: ["tests/**/*.ts"]` — vitest only collects `.ts` test files. Plan frontmatter specified `offlineGame.smoke.test.js` but that file would never be picked up by the test runner.
- **Fix:** Created file as `offlineGame.smoke.test.ts` with `@ts-expect-error` directives on JS imports (same pattern as `tests/bot/botDriver.test.ts`)
- **Files modified:** N/A — created as .ts from the start

**2. [Rule 1 - Bug] Fixed useMosjeAbility throwing on Binti ability without pending targets**
- **Found during:** Task 2 — smoke test execution revealed crash
- **Issue:** `driveBotTurn` calls `useMosjeAbility(state, botPlayerId, slot.cardId)` for all Mosjes with abilities. Binti's `ability_binti_cutting_words` expects a `discardedCardId` argument to identify which hand card to discard. When the bot calls it without `_pendingTargets`, the ability throws `'Binti ability requires discarding a card from hand'` — crashing the game loop.
- **Fix:** Wrapped the `fn(gameState, playerId, mosjeId)` dispatch in `useMosjeAbility` with a try/catch. On throw, logs a warning and returns `{ state: gameState, success: false, error: err.message }` — same return shape as other failure cases. The bot driver already checks `if (result.success)` so it gracefully skips the ability.
- **Files modified:** `src/engine/turnManager.js` (lines ~803-812)
- **Commit:** `ad01c4f`

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are purely engine-local (turnManager, main.js UI helpers) and test files.

## Known Stubs

None. The smoke test drives real engine state to a real FINISHED outcome. The renderAndCheckWin helper calls the real handleGameOver which shows the real showRewardOverlay.

## Self-Check: PASSED

- `src/main.js` — FOUND
- `tests/bot/offlineGame.smoke.test.ts` — FOUND
- `src/engine/turnManager.js` — FOUND
- `renderAndCheckWin` in src/main.js: `grep -c renderAndCheckWin src/main.js` = 17 — VERIFIED
- `isOffline.*FINISHED` pattern: `grep -c` = 2 — VERIFIED
- commit `742f9c5` — FOUND in git log
- commit `ad01c4f` — FOUND in git log
- 664 tests passing — VERIFIED
