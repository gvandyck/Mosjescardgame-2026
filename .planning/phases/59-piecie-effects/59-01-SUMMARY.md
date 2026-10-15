---
phase: 59-piecie-effects
plan: 01
requirements: [EFX-02]
key-files:
  created: [src/engine/piecies/runPiecieEffect.js, src/engine/piecies/resumePiecieChoice.js, src/engine/piecies/afterPiecieEffect.js, src/rules/piecieConditions.js, src/rules/piecieTargets.js, src/engine/targets/piecieTargetOptions.js, src/engine/table/levelGateError.js]
  modified: [src/engine/turnManager.js, src/engine/mosje/resolvePendingChoice.js, src/engine/reactions/withReactionWindow.js, src/engine/table/piecieActivationGate.js, src/engine/table/sweepStaysSlots.js, src/bot/botDriver.js, src/main.js, src/data/piecies.js]
completed: 2026-10-15
---
# Phase 59 Plan 01: Piecie framework Summary

Piecie effects can pause on a choice and resume the same activation; Level 2+ and Only-if/Needs conditions are data-driven and checked before Energy; one target table covers all 73 Piecies.

## Commits
- 1b881e4 Task 1: pause/resume (hook 'piecie'); post-effect half runs once; Dubbele Temminks uses the same runner.
- a20155d Task 2: gate + conditions + PIECIE_TARGETS + generic picker + Stays data + V4 runner retired.

## Notes
- Effects keep (state, playerId, ctx) with ctx = { slotIndex, free, resume }. A paused Piecie skips its reaction window at pause time; it opens when the last answer arrives (resolvePendingChoice wraps the resume).
- Bot: after activatePiecie, bot pauses are settled; a human's pick halts the bot step ("waits for your choice").
- Stays: Tikker and MP Hemorrhage are `stays: "custom"`; sweepStaysSlots ends both at the end of the owner's next turn (fallback; the MP Hemorrhage "next to the first Mosje it attacks" bookkeeping comes in 59-03).
- Retired: tests/ui/cards/piecie-effects.spec.js and the V4 Piecie block of card-registry.js (V4 numbers). Every Piecie gets a Card List entry in the new registry by 59-11.
- Condition ids: Shoettoe = piecie_energy_surge, Shhh popo komt! = piecie_popo_komt.

## Deviations
- [Rule 3] reaction-windows.test.ts: the Dikke Taks board now has a Level 2 Mosje (the gate refuses Level 1; assertions unchanged). no-active-mosje.test.ts: UI check now looks for PIECIE_TARGETS (picker moved to the target table); the bot check still uses OWN_TARGET_EFFECT_IDS.
- Staged scripts/obby2 generator comments and STAYS_BY_ID (16) to match the ruling.

## Known gaps
- Keyboard/Mouse/Controller, Shoettoe, Those Eyelashes etc. effect bodies still V4 (rewritten in 59-02+). No Playwright run in this plan.

## Verification
npm test 144 files green (1467 tests); node --check on the 6 UI files and all touched src files clean.

## Self-Check: PASSED
