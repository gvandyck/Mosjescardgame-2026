---
phase: 55
plan: 05
requirements-completed: []
key-files:
  created: [src/engine/table/tableRules.js, tests/engine/v4-leftovers-removed.test.ts]
  modified: [src/abilities/questLogic.js, src/engine/gameState.js, src/engine/turnManager.js, src/main.js, src/ui/boardRenderer.js, src/bot/botDriver.js, tests/helpers/makeEngineState.js, tests/helpers/testHelpers.js, tests/engine/first-turn-quest-lock.test.ts, tests/engine/snelle-piecie-full-slots.test.ts]
---
# Phase 55 Plan 05: V4 leftovers Summary

First-turn Quest lock deleted; `PIECIE_SLOT_COUNT = 3` / `MAX_FIELD_MOSJES = 2` added in `src/engine/table/tableRules.js` and used by state init, `normalizePiecieSlots` (truncates Firebase data, T-55-09), the full-slot checks, and main.js rehydration (boardRenderer uses a local const of 3). Static guard `v4-leftovers-removed.test.ts` added (guard verified to fail on a re-added `skipNextTurn`). RULE-10 NOT ticked: the "active Mosje" removal is 55-06.

## Changed expectations
- first-turn-quest-lock.test.ts: first player is now attemptable on turn 1 (old assertion encoded a V4 rule); the wrapper test uses negative MP as its blocker.
- snelle-piecie-full-slots.test.ts: "full" is now 3 slots, not 4 (the full-slot checks in turnManager used a literal 4; now PIECIE_SLOT_COUNT).
- Guard allowlists `coertsCaravanShield.js`: its `includes('COST')` is a Caravan label check, not the removed fresh COST bypass.

`npm test` 111 files / 1131 tests green; node --check clean. STATE/ROADMAP edited by hand.

## Self-Check: PASSED
