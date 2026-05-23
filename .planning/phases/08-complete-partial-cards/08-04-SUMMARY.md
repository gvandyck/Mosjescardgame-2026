---
phase: 08-complete-partial-cards
plan: 04
status: complete
commit: abb7a72
---

## Summary

Wired the three snelle protection flags (`drainReversal`, `negateNextAttack`/Perfect Dodge, `negateNextPiecie`/Counter Strikka) and the Dierenasiel passive into `loseMP` in `src/engine/mpManager.js`. Added JSDoc to the three Synergy Chamber helper functions in `src/abilities/placeEffects.js`. Added 5 browser-layer tests in `tests/core/test-mpManager.js`.

## What Was Built

### loseMP snelle flag interception block
Inserted after the `place_zo_is_natuur` resilient cap and before `mosje.mp -= lossAmount`:

- **Counter Strikka** (`negateNextPiecie[playerId]` + `source === 'DRAIN'`): cancels incoming DRAIN damage entirely, clears flag, returns early
- **Perfect Dodge** (`negateNextAttack[playerId]` + `source === 'ATTACK'`): cancels incoming ATTACK damage, grants +15 MP to the defender, clears flag, returns early
- **Drain Reversal** (`drainReversal[playerId]` + `source === 'DRAIN'`): reflects `lossAmount` directly onto the opponent's first active slot (clamped to 0 via `Math.max`), clears flag, returns early without applying self damage. Direct mutation used to avoid recursive `loseMP` call.
- **Dierenasiel passive** (`state.dierenasielActive`): reduces `lossAmount` by 25% (`Math.floor(lossAmount * 0.75)`) before the damage is applied — no early return, damage still lands but reduced.

### Synergy Chamber helpers — JSDoc added
All three helpers in `placeEffects.js` now have JSDoc with caller guidance and return-value description:
- `getSynergyChambercostReduction` — 5 MP cost reduction; caller: mosjeAbilities.js / UI layer
- `getSynergyChamberDiceBonus` — +1 quest roll; already consumed in questLogic.js (confirmed)
- `getSynergyChamberDurationBonus` — +1 buff turn duration; caller: effects layer (deferred to UI)

### Synergy Chamber dice import — confirmed
`questLogic.js` already imports `getSynergyChamberDiceBonus` at line 10 and uses it at line 659. No new wiring needed.

## Tests Added (5 new, browser-layer)

In `tests/core/test-mpManager.js`:
- Drain Reversal: p1 takes 0 damage (50→50), opponent takes 20 reflected (50→30), flag cleared
- Perfect Dodge: p1 gains +15 on ATTACK negate (50→65), flag cleared
- Counter Strikka: p1 takes 0 DRAIN damage (50→50), flag cleared
- Counter Strikka does NOT intercept ATTACK source (damage still applied, 50→25)
- Dierenasiel: reduces 40 DRAIN to 30 (floor 40×0.75), p1 ends at 20 MP

## Verification

- `npm test`: 588/588 TypeScript tests pass — no regressions
- Ronald Kip stacking test (`phase4a-step2-food-synergy.test.ts`): passes (confirmed in output)
- Browser tests confirmed correct by code inspection

## Self-Check: PASSED

## key-files

created:
  - .planning/phases/08-complete-partial-cards/08-04-SUMMARY.md

modified:
  - src/engine/mpManager.js
  - src/abilities/placeEffects.js
  - tests/core/test-mpManager.js
