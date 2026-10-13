---
phase: 58-mosje-abilities-and-synergies
plan: 01
subsystem: engine/synergy
requirements-completed: []
key-files:
  created: [src/engine/synergy/isHolderTextActive.js, tests/engine/synergy-2-0.test.ts]
  modified: [src/engine/synergyResolver.js, src/engine/turnManager.js, src/abilities/questLogic.js, src/abilities/piecieEffects.js, src/abilities/placeEffects.js, src/main.js, src/ui/boardRenderer.js]
commits: [42004f2, 2cd7999]
---
# Phase 58 Plan 01: Synergy 2.0 Summary

`isHolderTextActive` is now the single gate for holder texts; Synergy Chamber is passive; Senor West (+15 Physical), FPS West (both +10), Binti (food +10) and Youri (Piecie ready on placement) are wired. V4 pairs removed (Alyssa-Jisca, Chris+Youri, DJ +2, Gandoe-Michelle kicker/+15, Binti FOOD double, Chamber waiver incl. its UI button and pills).

## Test changes (no test weakened; V4 rules gone)
- Deleted: alyssa-jisca-synergy-resolver.test.ts, ui/cards/alyssa-jisca-synergy.spec.js (Scenario A fixme closed).
- place-synergy-chamber.test.ts: removed the 5 waiver cases (Task 2 describe); kept the 2 "dead bonuses" cases.
- gandoe-michelle-synergy.test.ts: removed 4 kicker cases + Gandoe +15 case; Michelle KNOWN GAP case kept (now asserts no partner bonus).
- youri-chris-synergy.test.ts: Chris All-Rounder + Youri now expects turnNumber+1 (no longer a partner).
- food-double-synergy.test.ts rewritten to the +10 rule (only Coert Tech is a partner).
- ronald-kip-stacking: Binti+Coert Tech now 10 -> 70 L1 (was V4 double +100 -> L2 at 0).
- ability-text-reconciliation: removed DJ 80/20 +2 case.

## Notes / deviations
- Binti +10 applied in Kannetje Melk, Broodje Doner, Ronald Kip, Chef's Special (the direct own-Mosje food gains); Varkenspootjes/Protein Shake are left to Phase 59.
- Martin Historian holder text lands in 58-10 (as planned). UI pill for FPS West not added.
- Pre-existing, not mine: tests/data/card-list-2-0-mosjes.test.ts fails on Ming Calculated Guess (Card List says "Snelle or Place", data says "Snelle, Place or Quest"; docs commit 099e2c8 vs generator-owned data). `npm test`: 1214 pass, that 1 fails.
- Playwright not run (headless card-test spec deleted only).
