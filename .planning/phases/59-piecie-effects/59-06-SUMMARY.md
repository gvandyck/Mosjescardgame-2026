---
phase: 59-piecie-effects
plan: 06
requirements: [EFX-02]
key-files:
  created: [src/abilities/piecie/attackRevealPiecies.js, src/abilities/piecie/utilityQuestPiecies.js, src/abilities/piecie/utilityHandPiecies.js, src/abilities/piecie/scheduleEndOfTurnLoss.js, src/engine/quests/mpForQuest.js, src/engine/quests/battleConcertRedirect.js, src/engine/hand/findPlayableHandIndex.js, src/engine/hand/turnLockKey.js, src/engine/table/releaseBoundPower.js, tests/abilities/piecies-attack-dice-draw-rest.test.ts]
  modified: [src/abilities/piecie/attackPiecies.js, src/abilities/piecie/utilityDicePiecies.js, src/abilities/piecie/utilityDrawPiecies.js, src/abilities/piecieEffects.js, src/engine/attack/mpHemorrhageMark.js, src/engine/turn/runEndOfTurnLosses.js, src/engine/table/sweepStaysSlots.js, src/engine/turnManager.js, src/engine/quests/resolveQuestAttempt.js, src/main.js, tests/ui/cards/piecie-registry-2-0.js]
completed: 2026-10-16
---
# Phase 59 Plan 06: Attack / dice / draw rest Summary

16 Piecies now run on Card List numbers: Snoeiertje, Continuous Assault, MP Hemorrhage, Kleine Taks, Jantje Jantje..., TweedeKANs, Loaded Dice, Dikke Plaat, Kan het?!, Perfect Setup, Battle Concert, Bagga of Greed, Perfect Rhythm, TemPiecie, F1 Telemetry, Those Eyelashes Tho...

## Commits
- 1b22f1e Effects, engine hooks, unit tests (29 new), V4 test expectations rewritten (both tasks share files, one commit).
- 88a4def 24 headless card-library cases.

## What changed
- Scheduled losses can hit an opponent Mosje (`targetPlayerId`): Kleine Taks queues two ticks, MP Hemorrhage one at the end of the owner's next turn. The Stays card is bound to the victim (discarded without loss when it leaves play); an unused Hemorrhage is discarded at turn end. The Hemorrhage KNOWN GAP is closed.
- Continuous Assault: `powerStaysBonus` on the Mosje, returned by `releaseBoundPower` when the card leaves (getPower reads it).
- Perfect Setup: `questMpOverride` (60..90 pick) read through `mpForQuest` by the two MP Quest conditions; ends with the turn. V4 Momentum Stabilizer refusal and the clamp are gone.
- Battle Concert: `battleConcertRedirect` in `resolveQuestAttempt` (Alyssa fail costs 0, chosen non-fresh opponent Mosje -15, once); target picked at activation.
- Dice: TweedeKANs `anyQuest` grant; Loaded Dice / Dikke Plaat +1 die and an `ownQuest` grant only with Jeffrey / DJ 80/20 / Alyssa, Fissa Fissa!.
- Perfect Rhythm counts `perfectRhythmDraws` (max 2); Dancing/DDR Chris +10 per counted activation (was: on the Rhythm card itself).
- TemPiecie: pause over the discard pile; the hand card carries `lockedTurn`; `findPlayableHandIndex` guards playPiecie, playSnellie, playMosje, playPlace and free activation from hand.
- Bagga (draw 2 then a pause over the whole hand), F1 (Martin Driver gets 30, draw 2), Eyelashes (the opponent is the chooser; Snelle block ends when their turn starts). `_baggaDiscard` UI branch deleted from main.js.

## Deviations
- [Rule 1] V4 expectations rewritten to Card List numbers, none weakened: Snoeiertje (+10 Power, end-of-turn loss instead of a +15 quest bonus), Perfect Rhythm DDR tests (+10 comes on a later activation), Those Eyelashes x2 (opponent picks), dead-flag Eyelashes; the Battle Concert `it.skip` is now a live test.
- `questBonusMP` consumer left in questLogic.js: no Piecie sets it any more, but three quest-behaviors tests exercise it and removing it would mean deleting them. Phase 60 can retire both.
- Jantje, Kleine Taks and Hemorrhage got new files / helpers beyond the plan's file list (one function per file).
- Ran the full piecie card spec (96 cases, all green), not only the 64-Piecie subset.

## Verification
npm test 148 files green; node --check clean (6 UI files + touched src, each separately); headless Playwright via a temporary config (deleted): piecie-cards-2-0 96/96. No sim run.

## Known gaps
Unbuildable texts: none. "Look at your opponent's hand" (Jantje) shows only hit or miss, no hand-reveal modal (Phase 60 hidden-information audit). Battle Concert fires once per activation (the first Alyssa fail). A bot answers Perfect Setup with 60 and Jantje with the first name in the list (default first option).

## Self-Check: PASSED
