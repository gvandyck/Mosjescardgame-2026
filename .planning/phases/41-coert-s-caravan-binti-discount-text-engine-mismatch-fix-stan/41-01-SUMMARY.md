# 41-01 Summary - Coert's Caravan Redesign

**Status:** COMPLETE
**Date:** 2026-07-18
**Branch:** `plan/phase-40-deck-ability-reconciliation`
**Commit/push:** Not performed.

## Outcome

Coert's Caravan is now a passive defensive Place instead of an end-phase drain
card:

- While active, each Coert-family Mosje ignores up to 40 MP of Quest damage per
  turn.
- Quest attempt costs are still paid normally.
- Non-Quest MP loss and drain effects are not prevented.
- Non-Coert Mosjes receive no protection from the place.

This follows the corrected discussion outcome: the stale Binti discount was not
resurrected, and the booster-side Tesla / Winston Jaaa / Varkenspootjes combo
space was left untouched.

## Files Changed

- `src/data/places.js` - Caravan trigger changed to `PASSIVE`; description now
  describes the 40 MP Quest-damage shield.
- `src/abilities/placeEffects.js` - old end-phase drain removed; effect kept as
  a passive registry marker.
- `src/engine/mpManager.js` - `loseMP` now applies the per-turn Coert Quest
  damage shield while Caravan is active.
- `tests/engine/place-coerts-caravan.test.ts` - old drain tests replaced with
  regression coverage for the passive shield and its exclusions.
- `docs/card-reference.md` - Caravan row updated with the new 2026-07-18 ruling.

## Verification

- `node --check src/data/places.js` - passed.
- `node --check src/abilities/placeEffects.js` - passed.
- `node --check src/engine/mpManager.js` - passed.
- `npm test -- place-coerts-caravan` - passed, 5/5 tests.
- `npm test` - passed, 71 files / 678 tests.
- `npm run validate` - passed; lint exited successfully with the existing
  warning baseline and all tests green.

## Safety

All work stayed on `plan/phase-40-deck-ability-reconciliation`. Existing user
and previous-agent changes in the working tree were preserved. No commit, push,
merge, rebase, branch deletion, PR, or `main` update was performed.
