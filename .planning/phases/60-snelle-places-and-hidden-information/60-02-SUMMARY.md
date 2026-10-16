---
phase: 60-snelle-places-and-hidden-information
plan: 02
requirements: [EFX-03]
commits: [a592f68, c70a3a8]
---
# Phase 60 Plan 02: Protect + dice Snelle

- One-shot `state.reactionMods` (`addReactionMod` / `takeReactionMod`): `reduce`, `gainFirst`, `save` bound to the threatened slot; cleared after the held action replays (T-60-03). `snelleReactionReducer` replaces the V4 Protector reducer; `emergencyHealingsStep` is the first `beforeLoss` step; Not Today! is honoured in `applyMpLossToSlot` and `markMosjeDefeated` (stays, sideways kept, MP >= 5).
- Bodies: `snelle/snelleProtectEffects.js` (Emergency Healings 25/35, Protector -30, Perfect Dodge -20/-30 by Physical, Drain Reversal -20 + fixed 10, Not Today!) and `snelle/snelleDiceEffects.js` (Sleutelpuntje via `questExtraDice`, Je Weet Niet rerolls all, Lucky Coin picks dice one by one, Creative 3 picks 1-6 values, validated T-60-04).
- V4 gone: loseMP Counter Strikka/Perfect Dodge/Drain Reversal interceptions, turnManager Perfect Dodge, victoryChecker negateNextElimination, `questDiceBonus`/`forceReroll` readers.
- Tests: `snelle-protect-dice.test.ts` (14); 8 registry cases (13 Snelle total, 21 cases) green headless x3 repeats. npm test 152 files green; node --check clean.
- Deviations: (1) tests encoding V4 flags rewritten to the new entries, same numbers (getemt, stub-engine-wiring 5/10, interrupt-data-fixes, quest-dice, loss-pipeline-order beforeLoss now 1 step). (2) `queuedRng` default Quest rng + `sideways` option on `setMosjeOnField` (testMode) so held-roll replays can be scripted. (3) Registry quest picks name the Quest (the stack modal otherwise picks a random face-up). (4) V4 `negateNextPiecie` flag (Counter Strikka) left for 60-03; UI pills in main.js/actionAnimations.js still mention old flags (inert).
- Unbuildable texts: none. Lucky Coin bot order: Done first when the roll is already as wanted, values high-first on own rolls.

## Self-Check: PASSED
