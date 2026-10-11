---
phase: 54-energy-levels-and-getemt
plan: 14
subsystem: engine
tags: [mp-funnel, mosje-abilities, quest, snelle, static-guard, obby-2.0]
requires: ["54-13"]
provides:
  - "mosjeAbilities.js, questLogic.js, snelleEffects.js: every relative MP change goes through applyGainToSlot / applyMpLossToSlot (or gainMP / loseMP)"
  - "no-direct-mp-writes guard covers 4 effect files"
key-files:
  modified:
    - src/abilities/mosjeAbilities.js
    - src/abilities/questLogic.js
    - src/abilities/snelleEffects.js
    - tests/engine/no-direct-mp-writes.test.ts
    - tests/engine/level-up.test.ts
    - tests/engine/getemt.test.ts
requirements-completed: []
duration: 20min
completed: 2026-10-11
---

# Phase 54 Plan 14: Mosje ability, Quest and Snelle MP funnel Summary

Mosje abilities, Quest hooks and Snelle effects now level up on 100+ and run the loss pipeline plus getemt; the static guard covers all four effect files.

## Commits
- e31175e: guard extended + ability/Quest/Snelle tests (red).
- 033e65d: three effect files funnelled.

## Red run (before the change)
- Guard: 14 offending lines in mosjeAbilities.js, 6 in questLogic.js, 6 in snelleEffects.js.
- level-up: Alyssa Fissa on L1 at 95 gave `[1, 105]` not `[2, 0]`; Momentum Rush gave `[1, 110]`.
- getemt: Coert's 10 MP cost on an L2 Mosje at 10 left `[2, 0]` (V4 loop) not `[1, 50]`; on an L1 Mosje it did not turn it sideways.
- The Quest-path cases (success over 100, failed Quest to 0, Jeffrey Brute Force) already passed: `resolveQuest` main path was already on gainMP/loseMP. They stay as pins.

## Changes
- mosjeAbilities.js: private `applyDamage(mosje, amount)` V4 loop (and `54-05 interim` / `_pendingDefeat`) replaced by `applyDamage(state, playerId, mosje, amount, source='ABILITY')` wrapping `applyMpLossToSlot`, plus an `applyGain` wrapper over `applyGainToSlot`. All 14 direct writes converted (Gandoe Wizard roll splits into loss/gain). Costs (Coert, Ming, Tuk, Amplifier) and self-gambles keep no entry-protection gate, as before.
- questLogic.js: Jeffrey Brute Force and FPS Coert gains use `applyGainToSlot`; Michelle double uses `applyGainToSlot`, Michelle half is a funnel loss of `roundToFive(reward/2)` (`roundToFive` kept). The dead, unused `applyQuestMpResult` helper was deleted.
- snelleEffects.js: 6 heals/refunds (Emergency Healings x2, Jensen, Momentum Rush, Bijna Welloe, Jantje steal) use `applyGainToSlot`.

## mp-direct-ok lines
None needed in these three files; no absolute "set MP" exists in them yet (Tactician set-MP arrives in Phase 58).

## Test expectations rewritten
None: all 1049 existing + new tests passed without edits.

## Notable 2.0 behaviour
- Ability costs (e.g. Coert pays 10) that bring a Mosje to 0 now do getemt (L2-3 drop a Level to 50, L1 sideways). Costs also pass through the loss pipeline (reductions apply); Phases 56-60 rewrite these texts.
- Michelle "halved" take-back is skipped when MP is already 0 (a level-up reset it); this equals the old clamp and avoids a getemt for removing a reward that was never held.
- Tactician transfer: source side is a funnel loss (can trigger getemt), target side a funnel gain (can level). Rewritten in Phase 58.

## Known gaps (not this plan)
- turnManager.js (Perfect Dodge `+= 15`, MP Adjuster revert), Places, bot and UI are 54-15 scope; main.js Varkenspootjes also still pending.
- Ability/Quest texts untouched (Phases 56-60).

## Deviations
None. Gates: `npm test` 102 files / 1049 tests green; node --check (CLAUDE.md list + touched files) clean. Playwright and sim not run.

## Known Stubs
None.

## Self-Check: PASSED
