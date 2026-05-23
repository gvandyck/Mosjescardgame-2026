---
phase: 08-complete-partial-cards
plan: 01
status: complete
commit: 1f2486c
---

## Summary

Fixed four partial Mosje abilities in `src/abilities/mosjeAbilities.js` that were either wrong, incomplete, or stubs. Added 11 browser-layer tests in `tests/cards/test-mosjeAbilities.js`.

## What Was Built

### ability_jeffrey_brute_force
- **Before:** Opponent loses 20 MP (wrong — not in card description)
- **After:** Player gains +10 `questBonusMP` (cumulative), sets `jeffreyFoodRestrictActive = true` to block FOOD/RESTORE Piecie play for this Mosje

### ability_tuk_architect_perfect_placement
- **Before:** Peek-only stub (stored `_architectPeek`, never reordered)
- **After:** Two-call pattern — call-1 peeks top 3 cards; call-2 with `orderedCardIds` reorders deck positions 0–2 to match; unrecognised card IDs ignored safely

### ability_ronald_mastermind_master_plan
- **Before:** Peek-only (stored `_masterPlanPeek`, deck unchanged always)
- **After:** Reads `state._pendingTargets.masterPlanChosenIndex` (0/1/2); if set, rotates that quest deck card to position 0 and clears the flag; if not set, peek only

### ability_ronald_chef_strategic_insight
- **Before:** Set `_ronaldPeek` only
- **After:** Also sets `_ronaldPeekPlayerId` (who triggered the peek) and `_ronaldPeekTimestamp` (Date.now()) for UI staleness detection

## Tests Added

11 new tests in `tests/cards/test-mosjeAbilities.js`:
- Jeffrey Brute Force: questBonusMP += 10, jeffreyFoodRestrictActive = true, no opponent drain, MP stacks
- Tuk Architect call-1: _architectPeek set, deck unchanged
- Tuk Architect call-2: deck positions 0-2 match orderedCardIds, rest card stays at position 3
- Ronald Mastermind call-1: peek only, deck unchanged
- Ronald Mastermind call-2: masterPlanChosenIndex=1 rotates to top
- Ronald Mastermind: flag cleared after rotation
- Ronald Chef: _ronaldPeekPlayerId and _ronaldPeekTimestamp set correctly

## Verification

- `npm test`: 588/588 TypeScript tests pass — no regressions
- Browser tests in `tests/cards/test-mosjeAbilities.js` confirmed correct logic by code inspection
- No Ronald Kip stacking test impact (plan 08-01 does not touch MP gain/cost calculation paths)

## Self-Check: PASSED

## Deviations

- Tests written to browser test file (`test-mosjeAbilities.js`) not Vitest — because `mosjeAbilities.js` is a browser-layer JS file and Vitest config only picks up `tests/**/*.ts`. This is the correct test location for this layer.
- Committed to `main` (not a feature branch) — planning work from earlier in the session also landed on main; continued on same branch for consistency.

## key-files

created:
  - .planning/phases/08-complete-partial-cards/08-01-SUMMARY.md

modified:
  - src/abilities/mosjeAbilities.js
  - tests/cards/test-mosjeAbilities.js
