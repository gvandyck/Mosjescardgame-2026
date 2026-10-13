---
phase: 58-mosje-abilities-and-synergies
plan: 08
subsystem: engine/mosje-abilities
requirements-completed: [EFX-06]
commits: [657767a, 6820b1a]
---
# Phase 58 Plan 08: Tactician, Jeffrey, Destroyer, Martin Driver Summary

EFX-06 done: The Tactician sets one Mosje (own, or a non-fresh opponent's) to 10-75 for 2 Energy; `slot.tacticianSet {realMp, delta}` is kept by the gain/loss funnels and `snapBackTacticianSet` restores real MP + delta at endTurn (5-grid, 0-95, no level-up). Level-up or getemt ends the set early (Card List ruling). Jeffrey Strongman = questSuccess trigger +10 extra plus a 27-id MP-Piecie gate (normal and free); Gandoe Destroyer = lowest-level non-fresh Mosje to the Welloe pile, owner pendingChoice on a tie (`destroyerStrike` hook, bot settles via the existing post-ability settle); Martin Driver = Perfect Line +15 extra and Pit Stop (1 Energy, discard 2, draw 3, +10). EFX-01 stays unticked (8 of 12 plans).

## Choices / deviations
- Jeffrey's and Martin's "+N extra" are questSuccess triggers (separate gain after the Quest's own win MP, so Michelle never doubles them). The V4 Jeffrey block in questLogic and its function were deleted.
- Snelle are not in the Jeffrey gate (Card List says Piecies).
- Destroyer rule input removed (target is automatic); botDriver gate now uses Energy + non-fresh candidates (it still checked MP).
- Pit Stop added to NO_DOUBLE_ABILITIES; the Amplifier double test now uses Ming Natural (Tuk and Pit Stop are once per turn). ability-defaults test uses Binti for the oppMosje default.
- Not buildable-as-written: none.

## Tests (none weakened)
New: tactician (E26, 10), mosjes-rest-a (16). `npm test` 1379 pass / 4 skipped; node --check clean (6 UI files + touched src). No Playwright or sim run.

## Self-Check: PASSED
