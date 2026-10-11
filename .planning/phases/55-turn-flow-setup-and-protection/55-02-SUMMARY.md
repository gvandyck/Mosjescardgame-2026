---
phase: 55
plan: 02
requirements-completed: [RULE-05, RULE-06]
key-files:
  created: [src/engine/turn/placeEmptyFieldMosje.js, src/engine/turn/clearOwnerProtections.js, src/engine/turn/expireThisTurnEffects.js, tests/engine/empty-field-r1.test.ts, tests/engine/turn-steps.test.ts]
  modified: [src/engine/turnManager.js, src/main.js, src/engine/mp/applyGainToSlot.js, src/engine/mp/normalizeSlotMp.js, src/engine/mp/getPower.js]
---
# Phase 55 Plan 02: Turn loop Summary

startTurn now runs win check, +1 Energy, draw (R5), R1 empty field, start triggers, then clears the owner's fresh and level-up flags (R1 Mosje stays fresh). The +10 turn trickle is gone. endTurn expires `powerBoostThisTurn`/`immuneThisTurn` on all Mosjes. Level-ups set `levelUpProtected`; `getPower` adds `powerBoostThisTurn`. main.js logs the R1 placement via a one-shot `_r1Event` marker (`logTurnTrickle` removed).

## Changed expectations (not weakened)
- level-up.test.ts: "turn trickle can level at 95" became "no trickle: stays L1 at 95" (trickle removed in 2.0).
- place-bank-chilling.test.ts: expected MP lost the +10 trickle (20+15, 30+15, 20).

## Deviations
- R1 treats Mosjes with no `cost` (binti_creator, amplifier, coert_kastelein) as most expensive (99), not free.
- Opponent-less tests need a Mosje on both sides or checkLoss ends the game.

## Verification
`npm test` 106 files / 1091 tests green; node --check clean on all touched files.

## Self-Check: PASSED
