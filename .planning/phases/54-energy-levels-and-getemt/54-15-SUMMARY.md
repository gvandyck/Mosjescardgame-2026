---
phase: 54-energy-levels-and-getemt
plan: 15
subsystem: engine
tags: [mp-funnel, places, turn-manager, bot, ui, static-guard, ronald-kip, smoke-invariants, obby-2.0]
requires: ["54-12", "54-14"]
provides:
  - "placeEffects.js, turnManager.js, botDriver.js, main.js: every relative MP change goes through applyGainToSlot / applyMpLossToSlot (or a marked absolute set)"
  - "V4 _pendingDefeat flag and regression loop removed from the whole of src"
  - "no-direct-mp-writes guard covers all of src/abilities, src/bot, turnManager, gameState, victoryChecker and main.js"
  - "tests/engine/ronald-kip-stacking.test.ts (7 cases) and per-turn 2.0 invariants in the Example-Deck smoke"
key-files:
  created:
    - tests/engine/ronald-kip-stacking.test.ts
  modified:
    - src/abilities/placeEffects.js
    - src/engine/turnManager.js
    - src/engine/victoryChecker.js
    - src/bot/botDriver.js
    - src/main.js
    - tests/engine/no-direct-mp-writes.test.ts
    - tests/engine/getemt.test.ts
    - tests/bot/offlineGame.smoke.test.ts
requirements-completed: [RULE-02, RULE-03, RULE-09]
duration: 25min
completed: 2026-10-11
---

# Phase 54 Plan 15: Last MP funnels, Ronald Kip stacking and smoke invariants Summary

Place effects, turn loop, bot and UI now change MP only through the 2.0 funnels; the V4 `_pendingDefeat` path is gone and real bot games keep every 2.0 invariant on every turn.

## Commits
- 7741f72: guard + Place getemt/level-up tests (red: Drain Zone left L2 at 10 wrong, Zo is Natuur gave 105 not L2 at 0, guard flagged placeEffects).
- 36a56c2: placeEffects.js funnelled (private V4 `applyDamage` loop replaced by an `applyMpLossToSlot` wrapper, entry-protection fizzle kept; gains via `applyGainToSlot`).
- 835d2ba: turnManager, botDriver, main.js funnelled; `_pendingDefeat` removed from victoryChecker; guard now globs all MP-writing files.
- bfa4237: ronald-kip-stacking.test.ts + smoke invariants.

## mp-direct-ok lines
- turnManager.js: MP Adjuster revert (floor 0, `roundToFive`, no level/getemt); Leipe Swap swap-back (two lines).
- main.js: test hook `setMosjeMP` (absolute set); MP Adjuster absolute set.
- (Earlier plans, unchanged: piecieEffects.js revive copy and Leipe Swap.)

## Test expectations rewritten
None: no existing test needed an edit. New tests only (getemt: 2 Place cases; ronald-kip-stacking: 7; smoke: third pairing plus invariants, verified non-vacuous by temporarily breaking the 5-grid check, which made 4 of 5 smoke tests fail).

## Other 2.0 fixes found on the way
- MP Adjuster offered a "100 MP" option, which breaks the "MP < 100" rule; it is now "95 MP".
- Perfect Dodge (+15), Aad Recovery (+40) and both Varkenspootjes resolves (+60 Binti / -30 others, bot and UI) now level up / run the loss pipeline and getemt. Varkenspootjes keeps its V4 amounts (text rewrite is a later phase).
- MP-as-cost scan: no remaining MP spend or MP gate in src. Only display labels remain (`mpCost` chips in deck-builder.js, packOpeningOverlay.js, modalManager.js, cardV1 formatCost): cosmetic, nothing is paid. Not changed.

## Smoke stands in for the sim
`npm run test:sim` was NOT run (orchestrator rule: long, old deck ids until Phase 64). The Node smoke is the phase's stand-in: three seeded Example-Deck pairings (TAKSEN/REGELAARS, CREATIEVELINGEN/TAKSEN, REGELAARS/CREATIEVELINGEN) assert every turn: MP on the 5-grid, 0 <= MP < 100 (<= 95 at Level 3), level 1-3, Power % 10 and >= 0, Energy integer 0-6, no throw.

## KNOWN GAP (V4 effect wiring, fix in Phases 56-60)
Place, Piecie and Varkenspootjes amounts and texts are still the V4 ones; only the MP mechanics (grid, level-up, getemt) are 2.0. Ronald Kip's +50/+60/+100 values are pinned as "what the code does today"; Phase 59 rewrites them to the Card List text.

## Deviations
None. Gates: `npm test` 103 files / 1075 tests green; `node --check` clean (CLAUDE.md list plus all src/engine, src/bot, src/abilities, src/ui files). Playwright and sim not run.

## Known Stubs
None.

## Self-Check: PASSED
