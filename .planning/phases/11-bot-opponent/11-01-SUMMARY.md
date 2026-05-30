---
phase: 11-bot-opponent
plan: 01
subsystem: bot
tags: [bot, ai, heuristic, turn-driver, pure-function]

requires:
  - phase: 10-deck-balance
    provides: Stable turnManager.js action functions the bot calls

provides:
  - Pure driveBotTurn(gameState, botPlayerId) function in src/bot/botDriver.js
  - 8 unit tests covering all heuristic branches

affects: [11-02, 11-03, offline-game-loop, game-page]

tech-stack:
  added: []
  patterns:
    - "Bot calls same turnManager.js action functions as human player — no separate bot engine"
    - "All heuristic steps are pure: reassign local state variable only, never mutate input"

key-files:
  created:
    - src/bot/botDriver.js
    - tests/bot/botDriver.test.ts
  modified: []

key-decisions:
  - "Test file extension changed to .ts (vitest only picks up tests/**/*.ts per vitest.config.js)"
  - "attemptPersonalQuest called as (state, questCardId) — plan's interface doc had wrong signature (playerId was extra param); actual function uses state.activePlayerId internally"
  - "attemptGeneralQuest already increments questsAttemptedThisTurn internally — no double-increment needed"
  - "Test 3 uses piecie_te_hard_gaan (ATTACK tag) with mosje_gandoe_wizard to avoid Jeffrey's FOOD/RESTORE block"

patterns-established:
  - "Bot driver pattern: pure function, sequential priority steps, local state reassignment only"

requirements-completed: [BOT-01, BOT-03]

duration: 30min
completed: 2026-05-31
---

# Phase 11 Plan 01: Bot Driver Summary

**Priority-based heuristic bot turn driver — pure function calling turnManager.js actions in sequence (play piecies, activate, quests, places, Mosje ability, endTurn)**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-31T00:25:00Z
- **Completed:** 2026-05-31T00:55:00Z
- **Tasks:** 2 (TDD tasks combined into one commit)
- **Files modified:** 2 created

## Accomplishments
- `driveBotTurn(gameState, botPlayerId)` exported from `src/bot/botDriver.js` — 7-step priority heuristic, fully pure
- 8 unit tests covering: no-op, play piecie, activate piecie, general quest, play place, immutability, endTurn called, real-data smoke
- Zero multiplayer imports anywhere in `src/bot/`
- Full suite: 661 tests passing (up from 653)

## Task Commits

1. **Tasks 1+2: Implement driveBotTurn + write unit tests** — `fbf6158` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified
- `src/bot/botDriver.js` — Pure bot turn driver: imports turnManager.js + questLogic.js, runs steps 1-7 + 3b
- `tests/bot/botDriver.test.ts` — 8 unit tests for all heuristic branches

## Decisions Made
- Test file uses `.ts` extension because vitest.config.js only picks up `tests/**/*.ts`
- `attemptPersonalQuest` called with `(state, questCardId)` — plan's interface doc had `(state, playerId, questCardId)` but actual function signature uses `state.activePlayerId` internally
- Bot uses `rollDie() >= 4` as quest success threshold (50% success rate — no strategy required for this phase)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test file extension changed from .js to .ts**
- **Found during:** Task 2 (write unit tests)
- **Issue:** vitest.config.js `include: ["tests/**/*.ts"]` — a `.js` test file would be silently ignored
- **Fix:** Created `tests/bot/botDriver.test.ts` instead of `tests/bot/botDriver.test.js`
- **Files modified:** tests/bot/botDriver.test.ts
- **Verification:** `npm test -- tests/bot/botDriver.test.ts` runs 8 tests and passes
- **Committed in:** fbf6158

**2. [Rule 1 - Bug] Corrected attemptPersonalQuest call signature**
- **Found during:** Task 1 (reading turnManager.js source)
- **Issue:** Plan interface doc listed `attemptPersonalQuest(gameState, playerId, questCardId)` but actual function is `attemptPersonalQuest(gameState, questCardId)` — uses `state.activePlayerId` internally
- **Fix:** Called with `(state, cardRef.cardId)` instead of `(state, botPlayerId, cardRef.cardId)`
- **Files modified:** src/bot/botDriver.js
- **Verification:** All 8 tests pass including personal quest branch
- **Committed in:** fbf6158

**3. [Rule 1 - Bug] Fixed Test 3 Piecie selection to avoid Jeffrey's FOOD/RESTORE block**
- **Found during:** Task 2 (running tests)
- **Issue:** Test 3 used `piecie_kannetje_melk` (FOOD/RESTORE) with `mosje_jeffrey` who blocks those tags — activation always failed, slot stayed `activated: false`
- **Fix:** Changed test to `piecie_te_hard_gaan` (ATTACK tag) with `mosje_gandoe_wizard` — no blocking restriction
- **Files modified:** tests/bot/botDriver.test.ts
- **Verification:** Test 3 now passes
- **Committed in:** fbf6158

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All fixes necessary for correctness. No scope creep.

## Issues Encountered
- None beyond the documented deviations.

## Next Phase Readiness
- `driveBotTurn` is ready for the game page to call after detecting `activePlayerId === 'player_2'` (plan 11-03)
- The function is fully testable in isolation — future phases can mock turnManager.js if needed

---
*Phase: 11-bot-opponent*
*Completed: 2026-05-31*

## Self-Check: PASSED

- `src/bot/botDriver.js` — FOUND
- `tests/bot/botDriver.test.ts` — FOUND
- commit `fbf6158` — FOUND in git log
