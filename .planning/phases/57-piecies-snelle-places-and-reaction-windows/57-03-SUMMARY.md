---
phase: 57
plan: 03
requirements-completed: [TABLE-03, TABLE-06]
key-files:
  created: [src/engine/table/canLeaveWelloePile.js, tests/engine/snelle-slot.test.ts, tests/engine/welloe-pile.test.ts]
  modified: [src/engine/turnManager.js, src/abilities/piecieEffects.js, tests/engine/snelle-piecie-full-slots.test.ts, tests/engine/stays.test.ts, tests/abilities/mosje-reborn-graveyard.test.ts, tests/abilities/call-of-welloes-graveyard.test.ts]
---
# Phase 57 Plan 03: Snelle slots + Welloe pile gate Summary

playSnellie counts only filled Piecie slots (Place no longer counts), fills a free slot, runs the effect, then `finishPiecieActivation` discards at once; Blensen! (`stays: endOfTurn`) stays until `sweepStaysSlots` at endTurn. The V4 SNELLE_PIECIE endTurn sweep is removed. `canLeaveWelloePile` gates Mosje Reborn, Call of the Welloes and confirmCallOfWelloes under Welloe Graveyard. E23 (7 tests) and TABLE-06 (4 tests) added; `npm test` 124 files / 1180 passed.

## Test changes
- snelle-piecie-full-slots: expected error string changed to the new 2.0 message "Cannot play a Snelle: all 3 Piecie slots are full." (V4 text mentioned Place slots).
- stays.test.ts: 4th-Piecie case now asserts `success:false`, the exact error, and unchanged slots/hand (separate commit).
- Added Welloe Graveyard cases to both graveyard ability tests.

## Deviations
None. Deck-out/Welloe-pile reshuffle was already correct (also covered by E21); TABLE-06 test re-asserts it.
