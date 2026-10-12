---
phase: 57
plan: 02
requirements-completed: [TABLE-02]
key-files:
  created: [src/engine/table/discardPiecieSlot.js, src/engine/table/finishPiecieActivation.js, src/engine/table/sweepStaysSlots.js, tests/engine/stays.test.ts]
  modified: [src/engine/turnManager.js, src/engine/quests/questConditions.js, src/abilities/mosjeAbilities.js, src/data/piecies.js]
---
# Phase 57 Plan 02: Stays lifecycle Summary

Activated Piecies without `stays` go to discard at once; Stays cards keep a face-up slot (`stays`, `staysEnd`, `activatedRound`) until `sweepStaysSlots` ends them (start/end of owner's next turn, Blensen end of turn, Call of the Welloes when its linked Mosje is gone). V4 `persistUntilEndOfTurn`/`persistUntilEoT` removed from src. Endure Pain reads `entry.stays` only. E25 (6 tests) green. Commits: feat(57-02) Stays helpers + E25, test(57-02) V4 rewrites.

## Test changes (V4 persistence -> 2.0)
- Deleted `piecie-persist-eot.test.ts` (Dubbele Dosis "stays until end of turn"); counterpart is `stays.test.ts`.
- thematic-piecies: loaded_dice/perfect_rhythm/dikke_plaat `persists` true -> false and flag now `undefined`; Perfect Rhythm slots 0/1 `persistUntilEoT` objects -> `null` + card in graveyard.
- dead-flag-engine (3): `persistUntilEndOfTurn` true -> `stays` null. interrupt-data-fixes: laat_me_chillen -> `stays: endOfNextTurn`. leipe-swap: flag `toBeUndefined`. dead-flag-mosje Master Plan redbull: kept in slot -> in graveyard, no slot. botDriver/call-of-welloes: type field/comment only.

## Notes
- Helpers return new state; turnManager callers reassign `state`. Snelle sweep line in endTurn untouched (plan 57-03).
- `npm test` 122 files / 1167 passed. Playwright files under tests/ui still mention V4 flags (plan 57-07).
