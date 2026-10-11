---
phase: 54-energy-levels-and-getemt
plan: 05
subsystem: engine
tags: [levels, slot-factory, obby-2.0, bot]
requires: ["54-04"]
provides:
  - "createMosjeSlot: the single factory for every field Mosje, Level 1 by default"
  - "getLevelRow and refreshLevelTraits helpers (traits come from the level row)"
  - "Levels stored 1-3 in engine, effects and bot"
affects: [54-06, 54-07, 54-08, 54-09, 54-10, 54-12]
key-files:
  created:
    - src/engine/mp/createMosjeSlot.js
    - src/engine/mp/getLevelRow.js
    - src/engine/mp/refreshLevelTraits.js
    - tests/engine/mosje-slot-factory.test.ts
  modified:
    - src/engine/gameState.js
    - src/engine/turnManager.js
    - src/engine/mpManager.js
    - src/abilities/piecieEffects.js
    - src/abilities/mosjeAbilities.js
    - src/abilities/placeEffects.js
    - src/bot/botDriver.js
    - src/bot/strategy/assessQuestRisk.js
key-decisions:
  - "Level storage is 1-3 (research Open Question 5, RESOLVED)"
  - "Interim bottom level: loseMP and the three applyDamage copies use level <= 1 until 54-09/54-10"
  - "Traits are taken from the level row at slot creation (decision 7); refreshLevelTraits is available for level changes"
requirements-completed: []
duration: 25min
completed: 2026-10-11
---

# Phase 54 Plan 05: Levels 1-3 and the slot factory Summary

Every Mosje that enters the field (game start, playMosje, Call of the Welloes, Mosje Reborn, saved-state restore) is now built by `createMosjeSlot` at Level 1 with its startMP. Levels are 1-3, nothing creates a Level 0 slot, and the bot reads Level 1 as the lowest level.

## Commits
- 2123616 slot factory, level-row helpers, creators migrated, Ronald Kip / Super Saiyan gates removed (Task 1)
- b69911b readers shifted, interim bottom level, bot semantics, fixtures (Task 2)

## Notes
- The old `createMosjeSlot` in gameState.js and `createMosjeSlotFromDefinition` in turnManager.js are deleted.
- Saved-state restore passes the saved level through the factory, so it is clamped to 1..3 (T-54-12).
- Call of the Welloes builds Level 1 / 50 MP; Mosje Reborn keeps its V4 MP amount (startMP + 40), at Level 1. Raw-record fallback paths still exist when a card def is missing.
- Mid-game V4 state across the deploy boundary is not migrated (T-54-13, accepted: games are ephemeral).
- Martin Driver's gain table now indexes `clamp(level, 1, 3) - 1`.

## Tests
- New: tests/engine/mosje-slot-factory.test.ts (8 cases). The creator cases (game start, playMosje) failed first, passed after migration.
- Fixtures shifted +1 (V4 Level 0/1/2 to 1/2/3), expectations kept: tests/engine/mp-level-regression.test.ts, tests/engine/defeat-at-zero-mp.test.ts, tests/engine/west-calculated-guess.test.ts, tests/bot/strategy.test.ts, tests/bot/botDriver.test.ts.
- npm test: 96 files / 995 tests green. node --check (CLAUDE.md list plus touched files) clean. Playwright and sim not run.

## Deviations
- [Rule 1] defeat-at-zero-mp KNOCKOUT case: the opponent fixture would have shifted to Level 3, which the still-present V4 instant win ends. Its opponent is kept at Level 2 (it only needs to exist).
- [Rule 1] tests/bot/offlineGame.smoke.test.ts "deck-out" case: with levels 1-3 plus the V4 win at Level 3, Binti reached Level 3 by a single Quest before any deck-out, so the skip path was never exercised. The test now sets its own fixed seed (99, chosen because it reaches the skip path; seeds 1, 2, 3 also pass). Assertions are unchanged. This is a symptom of the interim state: the V4 win at Level 3 now needs one fewer level-up. 54-12 replaces that rule; the seed can then be re-checked.
- `state.advance-plan` was not used; STATE.md updated by hand.

## Known Stubs
None.

## Self-Check: PASSED
