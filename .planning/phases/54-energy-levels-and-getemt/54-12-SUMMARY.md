---
phase: 54-energy-levels-and-getemt
plan: 12
subsystem: engine
tags: [win-lose, hold-level-3, knockout, obby-2.0]
requires: ["54-11"]
provides:
  - "winLose/checkWin.js: hold-Level-3 win, first thing in startTurn"
  - "winLose/checkLoss.js: no Mosje on field, in hand or in deck = lost"
key-files:
  created:
    - src/engine/winLose/checkWin.js
    - src/engine/winLose/checkLoss.js
    - tests/engine/hold-level-3-win.test.ts
    - tests/engine/no-mosje-left-loss.test.ts
  modified:
    - src/engine/turnManager.js
    - src/engine/victoryChecker.js
    - src/main.js
    - src/bot/strategy/assessQuestRisk.js
    - tests/bot/strategy.test.ts
    - tests/bot/offlineGame.smoke.test.ts
  deleted:
    - tests/engine/instant-win-level3.test.ts
requirements-completed: [RULE-04]
duration: 30min
completed: 2026-10-11
---

# Phase 54 Plan 12: Hold-Level-3 win and no-Mosje-left loss Summary

A player wins by starting their turn with a Mosje still at Level 3, and loses with no Mosje left on field, in hand or in deck; the V4 instant-L3, Quest Master and 250-MP wins are gone.

## Commits
- 8702776: checkWin/checkLoss, startTurn and checkVictory rewired, E7/E8 tests, V4 instant-win test deleted.
- 11612e2: win texts, bot `winsGame`, smoke test updates.

## Decision 2 (recorded)
`checkLoss` counts field + hand + deck only. Discard pile and Welloe pile do not count. A card is a Mosje when `type === 'MOSJE'` or its `cardId` is in MOSJES.

## Red run
Tests written first: E7 failed (the V4 instant win ended the game when the Mosje reached L3 / on the opponent's turn start); the E8 file failed to load (no checkLoss). After the change: 10/10 across both files.

## Changes
- `startTurn`: `checkWin(state, playerId)` is the first statement after the clone, before the log, `gainEnergy` and the `skipNextTurn` branch (so a skipped player still wins). `momentumCheckPhase` set/reset removed.
- `victoryChecker.getWinReason`: only KNOCKOUT (all opponents `checkLoss`), players evaluated in `getAllPlayerIds` order (T-54-28). LEVEL_3, QUEST_MASTER, MOMENTUM_DOMINATION branches deleted.
- `main.js` `describeWin`: LEVEL_3 "held Level 3 until their turn — victory!", KNOCKOUT "has no Mosje left outside the Welloe pile (last to fall ...)", the two V4 cases removed.
- `assessQuestRisk`: `winsGame = false` (comment points to Phase 61 BOT-01). New strategy test asserts a Quest taking L2/95 to L3 gives `levelsUp: true`, `winsGame: false`. The existing `getRequiredConfidence` winsGame test calls the helper directly and was left as is (the helper still supports the flag).
- `offlineGame.smoke.test.ts`: the two V4-deck cases asserting FINISHED were deleted; the deck-out case no longer asserts FINISHED (asserts the skip path was hit and turns kept advancing); header comment updated.

## Test expectation changes (why, under 2.0)
- `instant-win-level3.test.ts` deleted: V4 "win the instant L3 is reached" contradicts handoff §2b; E7 replaces it.
- Two V4 FINISHED smoke cases deleted: V4 decks disabled since Phase 53 and termination now depends on holding L3.

## Seed 99 re-check
Fixed seed 99 (54-05) is no longer needed: the deck-out smoke case passes with the shared 0xC0FFEE seed (the skip path is reached, the game happens to end by LEVEL_3 at turn 8). The override was removed.

## How games end now
Bot-vs-bot (human seat only ends turns) on the Example Decks, 15 games over 3 matchups, 300-iteration cap: all 15 FINISHED by LEVEL_3 (hold-L3), winner player_2 (the bot) every time, at turns 3-10. No infinite games. Note the human seat is passive, so this says nothing about balance, and no game ended by KNOCKOUT.

## Deviations
None. The unit test run was `npm test`: 102 files / 1039 tests green. node --check (CLAUDE.md list + touched files) clean. Playwright and sim not run.

## Known gaps
- UI/other code that still reads `level >= 3` instantly (e.g. Playwright specs expecting an instant L3 win) were not run here; Phase 64 covers 2.0 full-game specs.
- Attacks/Quests (Phases 55-57) are what will make non-bot-passive games end by KNOCKOUT.

## Known Stubs
None.

## Self-Check: PASSED
