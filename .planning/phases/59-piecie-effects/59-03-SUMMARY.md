---
phase: 59-piecie-effects
plan: 03
requirements: [EFX-02]
key-files:
  created: [src/abilities/piecie/attackPiecies.js, src/abilities/piecie/petPiecies.js, src/abilities/piecie/utilityProtectPiecies.js, src/abilities/piecie/addPowerThisTurn.js, src/abilities/piecie/resolvePiecieOppSlot.js, src/engine/turn/runEndOfTurnLosses.js, src/engine/mp/lossSteps/staysBoundReducer.js, src/engine/table/staysBoundGone.js, src/engine/table/discardBoundStays.js, src/engine/table/discardPiecieSlotInPlace.js, src/engine/table/payStaysStartGain.js, src/engine/attack/hitOneTarget.js, src/engine/attack/otherHitTarget.js, tests/abilities/piecies-ed-attack-protect.test.ts]
  modified: [src/abilities/piecieEffects.js, src/engine/actions/attackMosje.js, src/engine/turnManager.js, src/engine/victoryChecker.js, src/engine/mp/lossSteps.js, src/engine/table/sweepStaysSlots.js, src/engine/turn/expireThisTurnEffects.js, src/engine/attack/momentumDiefjeGain.js, src/engine/targets/ownTargetEffects.js, src/data/piecies.js, tests/ui/cards/piecie-registry-2-0.js]
completed: 2026-10-16
---
# Phase 59 Plan 03: Example-Deck Attack / Pet / protection Piecies Summary

10 more Example-Deck Piecies run on Card List numbers (26 of 26 done), with scheduled end-of-turn losses, the Dikke Taks double hit and Stays bound to a Mosje.

## Commits
- dbb9c32 Both tasks' code and unit tests (the machinery is shared, so one commit): the 10 effects, runEndOfTurnLosses (endTurn), hitOneTarget/otherHitTarget (attackMosje), staysBoundReducer in LOSS_STEPS, bound/startGain handling in sweepStaysSlots, discardBoundStays from markMosjeDefeated.
- 1cec4bb 15 headless card-library cases (41 in the spec in total).

## Deviations
- [Rule 1] Data: Momentum Diefje and Super Saiyan Mos had `requirement` level2/level1 (display chip only); the Card List has no Needs, set to "any".
- V4 expectations rewritten to Card List numbers: klaar-met-jou-graveyard, phase48 Dikke Taks / Momentum Diefje, stub-engine-wiring 6/7a/7e (now assert the Stays entry), mosjes-deck3-chain + free-activation-chain (Te Hard Gaan no longer damages the foe), reaction-windows (uses Klaar Met Jou with a 30 MP foe as the targeted Piecie; same moments asserted).
- Laat me chillen! left OWN_TARGET_EFFECT_IDS (no pick); Te Hard Gaan, Dikke Taks, Bowie & Stormey, ViannaPoes joined.
- Plan field `powerBonus` on a bound Stays entry not built: none of the 10 cards needs it (Power of these cards is "this turn" only).

## Decisions
- A bound Stays card ends when any Mosje it is bound to leaves play (discarded at once on Welloe-pile send, otherwise at the next sweep; the reducer ignores a gone Mosje).
- Bowie's pair bonus is evaluated when the card is activated.

## Verification
npm test 145 files / 1507 tests green; node --check clean (6 UI files + touched src); headless Playwright (temporary config, deleted): piecie-cards-2-0 41/41, mechanics VIS-08 (Laat me chillen) passes. No sim run.

## Known gaps
Unbuildable texts: none.

## Self-Check: PASSED
