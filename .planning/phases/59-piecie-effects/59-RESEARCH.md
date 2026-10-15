# Phase 59: Piecie Effects - Research (short)

**Date:** 2026-10-15 · Discovery level 0 (internal code only, no new packages) · Source: Card List Piecies + Rulings (Phase 59 bullet), 59-CONTEXT.md.

## Code map
- **Effects:** `src/abilities/piecieEffects.js` (1267 lines, one big V4 file, `effect_<id>` exports looked up by `cardDef.effectId` in `resolvePiecieActivation`, `src/engine/turnManager.js` ~L560). Per Gandalf (2026-10-15) Piecie effects live in ONE FILE PER CARD LIST SECTION: `src/abilities/piecie/{mp,attack,gear,pet,substance}Piecies.js`, Utility split into `utility{Draw,Dice,Chain,Protect,Place}Piecies.js` (each under ~200 lines). They keep the `effect_*` names; `piecieEffects.js` re-exports them, so data `effectId`s and `turnManager` lookups don't change. Helpers elsewhere stay one function per file.
- **Activation:** `activatePiecie` -> `activatePiecieCore` (turn/cooldown/ready checks, `piecieActivationGate`, `payEnergy`) -> `resolvePiecieActivation` (flip, Counter Strikka / Perfect Dodge, effect, Place on-draw, Perfect Rhythm draw, counters, Mosje `piecieActivated` triggers, `finishPiecieActivation` discard-or-Stays). Free activations: `src/engine/table/activatePiecieFree.js`.
- **Gate:** `src/engine/table/piecieActivationGate.js` (The Void tags, Jeffrey + `src/rules/givesMpPiecies.js`). `levelGate: 2` is in data for Dikke Taks / Harde Didde / Klaar Met Jou but **nothing enforces it**. No "Needs:/Only if" registry exists.
- **Targets:** `resolveOwnTargetSlot` / `resolveOppTargetSlot` read `_pendingTargets.own_slot_index` / opp index (else first eligible). UI pre-picks in `src/main.js` ~L1420-1650: own-target list `src/engine/targets/ownTargetEffects.js`, bespoke Affoe (`affoe_drain`/`affoe_gain`), Leipe Swap (`leipeYourSlot`...), and post-effect flags `_baggaDiscard`, `_callOfWelloesPending`, `_varkenspootjesPending`, `_mpAdjusterPending`, `_dingetjesPeek`.
- **Choice pause (Phase 58):** a job returns `{ needChoice: { playerId, key, options, choiceKind } }` -> `state.pendingChoice`; `resolvePendingChoice` writes `player._pendingTargets[key]` and resumes via `runTriggerJobs`; UI `src/ui/actions/settlePendingChoice.js`, bot `src/bot/settleMosjePauses.js` (both generic). Piecies have no resume path yet.
- **MP funnels:** `gainMP(state, pid, slot, amount, source)` (`src/engine/mpManager.js`, The Void check inside), `applyGainToSlot`, `applyMpLossToSlot` / `loseMP` with `LOSS_STEPS` (`src/engine/mp/lossSteps.js`: reducers incl. `statusReductionReducer`, `halvedLossReducer`). Power: `getPower` = level Power + `powerBoost` + `powerBoostThisTurn` + `powerBoostUntilOwnerTurnEnd`; `expireThisTurnEffects` clears this-turn keys.
- **Stays:** slot entry `{ stays: true, staysEnd: 'startOfNextTurn'|'endOfNextTurn'|'endOfTurn'|'custom', activatedRound, linkedMosjeCardId }`, ended by `sweepStaysSlots(state, pid, 'start'|'end')`. No "bound to a Mosje" link except Call of the Welloes.
- **Attack:** `src/engine/actions/attackMosje.js` + `ATTACK_TRIGGERS` (`momentumDiefjeGain`, `mpHemorrhageMark` exist but nothing arms them; KNOWN GAP comments).
- **Quests:** dice `getQuestDiceCount` already clamps 1..4; `QUEST_DICE_SOURCES.playerExtraDice` reads `player.questExtraDice`; after-roll pause + DJ reroll pattern in `src/abilities/mosje/djLuckyBeats.js` / `getEligibleReactions` / `resolveReaction`; win gain in `src/engine/quests/resolveQuestAttempt.js` (`gainMP(..., 'QUEST')`, `questSuccess` triggers); conditions `questConditions.js` (MP read from `slot.mp`), costs `questCosts.js` (food/substance tag via `PIECIES.tag`). `QUEST_BLOCKED` status read by `checkQuestCondition`.
- **Draws:** `src/engine/turn/drawFromEffect.js` (empty deck = nothing, counts `cardsDrawnThisTurn` for Artistic Expression). Most V4 effects splice the deck directly (no count).
- **Redbull:** `abilityDoubleTrigger` = V4 free echo in `useMosjeAbility` (turnManager ~L871-975); 2.0 = one extra use, cost paid again.
- **Tests:** card-test driver `tests/helpers/mosjeCardTest.js` (+ `mosjeCardSetup.js`, `mosjeCardTrigger.js` with `activatePiecie`, `answerModals`) works for Piecies; old V4 `tests/ui/cards/piecie-effects.spec.js` + `card-registry.js` PIECIE_SPECS. Guard `tests/data/card-list-2-0-piecies-snelle.test.ts:80` counts 4 `TODO(phase 59): confirm`. Meta guard `tests/meta/fixme-reasons.test.ts`. Bot smoke `tests/bot/offlineGame.smoke.test.ts` runs in `npm test`.
- **Data:** `src/data/piecies.js` has 74 entries (73 + cut `piecie_mp_adjuster`); Tikker and MP Hemorrhage `stays: null` (must become Stays per ruling); MP Amplifier / Synergy Field `givesMP:false` (confirmed by ruling).

## Gap table (V4 = body still follows the old text)
ED = in an Example Deck. Plan = where it is rewritten.

| Piecie | ED | Today | Gap to Card List | Plan |
|---|---|---|---|---|
| Kannetje Melk | y | 25 + Binti extra | direct deck splice n/a; OK, move to own file | 02 |
| Broodje Döner | y | 35 + Binti | move to own file | 02 |
| Protein Shake | y | FIGHTING subtype gate, 25/35 Boxing Ring | Physical ★ trait gate, ★★★ -> 35, Binti food extra | 02 |
| Varkenspootjes | y | UI flag, V4 60/-30 | any non-fresh Mosje; Binti +40, others -15; Binti food extra on gain | 02 |
| Nature's Gift | y | 30/40 Resilient ★★ | OK, own file | 02 |
| Momentum Boost | y | +15, V4 questBonusMP | +10 more only if THAT Mosje wins a Quest this turn | 02 |
| Grammetje Pieter | y | 4-6 +30 / 1-3 -15 | OK, own file | 02 |
| Dikke Jonko | y | opp first slot auto, direct draws | opponent picks own Mosje (+10), both draw via drawFromEffect | 02 |
| Larry / Zegeltje | y | V4 +20, questPrepBonus | die 1-2 -25 + discard 1 / 3-4 +20 / 5-6 +40 + draw 2 | 02 |
| Te Hard Gaan | y | V4 25 dmg to opp | own +20 Power this turn, end of turn -10 MP | 03 |
| Super Saiyan Mos | y | V4 questBonusMP | own +30 Power this turn | 03 |
| Boxing Gloves | y | V4 gain 25/40 | Physical ★★+: +10 Power, Gandoe +20 | 02 |
| Momentum Diefje | y | V4 steal 20 | +10 Power + arm `momentumDiefjeThisTurn` (hook exists) | 03 |
| Dikke Taks | y | V4 35 dmg + draw 2 | Level 2+ gate, +10 Power, attack hits both (fresh skipped), draw 1 | 03 |
| Harde Didde | y | V4 50 dmg | Level 2+ gate, opp Mosje <=40 MP -> Welloe pile (reaction moment, Mosje Shield) | 03 |
| Klaar Met Jou | y | V4 40 dmg + discard | Level 2+ gate, opp <=30 MP -> Welloe pile, draw 1 | 03 |
| Tikker | y | +40, QUEST_BLOCKED 1 | +40; Stays face-up until end of owner's next turn; that Mosje can't Quest on next turn | 02 |
| Affoe | y | bespoke picker; fresh fizzles whole | -15 opp / +10 own (pre-picked), + flaky card-chains spec | 02 |
| Straffoe | y | V4 30 to one opp | own -5, each opp Mosje -10 (fresh skipped) | 02 |
| Keyboard | y | V4 digital level MP | Digital Mosje on field gate; +10, draw 1 | 02 |
| Controller | y | V4 MP +1 die | gate; +10, +1 die | 02 |
| Boosterpackkie | y | partly | draw 1 via drawFromEffect; Coert +10; die 5-6 draw 1 more (only with Coert) | 04 |
| Zie je die Dingetjes | y | two-call UI flag | top 3 -> 1 to hand, rest back in chosen order (choice pause) | 04 |
| Dubbele Dosis | y | +1 die (57-07) | + one reroll of a die of that Quest (after-roll grant) | 04 |
| Stookerino | y | random discard, gain mpCost | look, choose, gain 10/Energy (max 30), Binti +10 | 04 |
| Chain Reaction | y | flag only (V4) | after next activation, one more ready Piecie free (once) | 04 |
| Afblijven! | y | V4 immuneThisTurn | Stays to start of next turn, bound Mosje -10 per loss | 03 |
| Laat me chillen! | y | status 20 once | Stays to end of next turn, next own loss -20 then discard | 03 |
| Bowie & Stormey | y | V4 halve all | pet line + named + Gandoe pair cover + start-of-next-turn +10 each | 03 |
| ViannaPoes | y | V4 halve all | pet line (named Cless) | 03 |
| Slecht Gezet | y | OK-ish | own Place back to hand / opp destroyed; no Place = nothing | 04 |
| Shhh, popo komt! | y | OK-ish | gate 3+ Mosjes total | 04 |
| Huisbaas | y | V4 recover from graveyard | gate top of any discard is substance; destroy; optional deck search + activate Place (pay) | 04 |
| Bong Hit Demolition | y | direct draws | destroy + draw 2 via drawFromEffect | 02 |
| Warm Kannetje Melk | | direct draws | -10, draw 2 via drawFromEffect | 05 |
| Shoettoe | | V4 <30, +20 | only if a Mosje has <=20 MP: it +30 | 05 |
| Stripje Bennies | | direct | draw 3, own -20 | 05 |
| Pot of Weed | | direct | draw 2 via drawFromEffect | 05 |
| Mouse | | V4 | gate; +10; look top 2 of any deck, reorder | 05 |
| Dumbbells | | V4 FIGHTING | Physical ★: +20; ★★★ draw 1 | 05 |
| Skipping Rope | | V4 | draw 1; Physical ★ -> +1 die | 05 |
| Ronald Kip | | 50/60 + draw | §6b: 60 + draw with Ronald Chef; draw via drawFromEffect; new test | 05 |
| Chef's Special | | V4 x30 | 15; with Ronald Chef: 15 per Piecie in opp hand (15..45), look at hand | 05 |
| MP Amplifier | | x1.5 | next gain this turn doubled, at most +40 extra; any source; not "gives MP" | 05 |
| Bagga of Greed | | UI flag | draw 2, discard 1 (choice pause) | 06 |
| F1 Telemetry Data | | V4 40 + quest bonus | 15 + draw 1; Martin Driver on field: he +30, draw 2 | 06 |
| Kan het?! | | V4 6 -> 50 | 5-6 +40 / 1-4 -10 | 06 |
| Snoeiertje | | V4 questBonusMP | +10 Power, end of turn -10 | 06 |
| Jantje Jantje... | | no-op | name a card, look; hit: discard + +20 Power; miss: own -10 | 06 |
| Continuous Assault | | V4 DoT on opp | Stays to end of next turn, bound own Mosje +10 Power | 06 |
| MP Hemorrhage | | V4 DoT | +20 Power; Stays; mark first attacked; end of next turn -10 then discard | 06 |
| Kleine Taks | | V4 4-turn DoT | Stays; chosen opp -10 at end of this turn and end of next turn; discard if it leaves | 06 |
| TweedeKANs | | V4 flag | one reroll this turn of any die (see ambiguity 4) | 06 |
| Loaded Dice | | +1 die | + Jeffrey reroll | 06 |
| Dikke Plaat | | +1 die | + DJ / Alyssa Fissa reroll | 06 |
| Perfect Setup | | V4 clamp real MP | counts as chosen 60-90 for Quest requirements this turn, real MP unchanged | 06 |
| Redbull | | V4 free echo | one Mosje: once-per-turn ability one more time, pay Energy again; + 5 redbull specs | 07 |
| Double Trigger | | V4 echo | both Mosjes, pay again | 07 |
| Dubbele Ding | | V4 flags | up to 2 hand Piecies activated RIGHT AWAY (pay each), each in a free slot, then resolve / discard (or Stays) — Gandalf ruling | 07 |
| Perfect Rhythm | | partly (DDR only) | draw per later activation max 2; Dancing/DDR Chris +10 each time | 06 |
| TemPiecie | | V4 first card | chosen discard card -> hand, can't place/play this turn | 06 |
| Leipe Swap | | swap + V4 revert | permanent swap, no level-up / getemt (VIS-02 fixme) | 07 |
| Mosje Shield | | WELLOE_SHIELD status | Stays; bound Mosje can't go to Welloe pile | 08 |
| Welloe Force | | 54/57 build | verify 15 thorns + discard cost under Stays | 08 |
| Mosje Reborn | | +40 | +30, fresh, chosen Welloe Mosje, limit 1 | 08 |
| Call of the Welloes | | UI flag | chosen, start MP, fresh, linked Stays both ways | 08 |
| Synergy Field | | flag, no consumer | Stays; each own ability MP gain +10 | 05 |
| Those Eyelashes Tho... | | first card discarded | opp discards their choice; +20; no Snelle for opp this turn | 06 |
| Battle Concert | | flag, V4 redirect | Alyssa fail: loses nothing, one opp Mosje -15 | 06 |
| Dingetje toch?! | | flag, no consumer | wildcard for requirements (see ambiguity 10) | 08 |
| Tony | | V4 halve all | pet line; Morning Luck 3-6 | 05 |
| Gekke Vogels | | V4 | pet line; Jisca+Alyssa+KatjeGang -> +15 each at start of next turn | 05 |
| KatjeGang | | V4 | pet line (named Alyssa) | 05 |

Cross-cutting: Binti food +10 on every food gain (Varkenspootjes, Protein Shake, Chef's Special, Ronald Kip; not on a loss); effect draws via `drawFromEffect` (Artistic Expression count); Level 2+ gate; limits (★★★★★, The Protector, Mosje Reborn = 1, already in data via `getCopyLimit`; a test pins it); +1 die cap 4 (already clamped).

## Pitfalls
- Moving effects out of `piecieEffects.js` must keep the `effect_*` names (data `effectId`s, `turnManager`, unit tests import them).
- Many unit tests encode V4 values; rewrite to Card List numbers, never loosen. Delete only if the card/rule is gone (name it in the SUMMARY).
- Free activations (Chain Reaction, Dubbele Ding) must not start Jisca / DDR Chris chain rolls (58 rule) and must still pass `piecieActivationGate` (incl. the new conditions).
- Hidden info (opponent hand, deck tops) is shown only in the acting player's modal; full hidden-info audit is Phase 60 (EFX-07).

## Readings - RESOLVED (Gandalf, 2026-10-15)
Accepted as written; plans implement them.
1. MP Amplifier + Binti food extra: the whole gain incl. Binti's +10 is doubled, extra still max +40.
2. MP Amplifier: next gain from any source (Quest, ability, Piecie), first gain only, ends at end of turn.
3. Binti food extra only on food gains, never on a food Piecie's loss (Varkenspootjes -15, Warm Kannetje Melk -10).
4. TweedeKANs: one Quest die, own or opponent Quest, at the after-roll pause this turn; not ability / Piecie dice.
5. Dubbele Dosis / Loaded Dice / Dikke Plaat reroll: at the after-roll pause of the owner's own Quest.
6. Chain Reaction: offered after the next paid Piecie this turn; free activation (no Jisca / DDR chain roll); Chain Reaction itself doesn't count.
7. Dubbele Ding: SUPERSEDED by Gandalf - chosen hand Piecies (max 2) activate right away, each paid, each needs a free slot, then resolve / discard (or Stays).
8. MP Hemorrhage with no attack that turn: discarded at end of turn, no effect.
9. Harde Didde / Klaar Met Jou on a Mosje Shield target: fizzles, Energy spent.
10. Mosje Reborn / Call of the Welloes: can't activate with an empty Welloe pile, no free spot, or while the Welloe pile is locked.
11. Gekke Vogels: only your own KatjeGang staying face-up counts.
12. Dingetje toch?!: named-card and tag requirements yes; not "Mosje on your field" checks; Level 2+ and MP conditions are not trait requirements.
13. Jantje Jantje: name from all distinct 2.0 card names.
14. Stookerino: every card type uses its Energy cost; 0-cost -> 0 MP.
15. Chef's Special with Ronald: replaces the base 15; minimum 15.
16. Perfect Setup: 60, 65, ... 90.
17. Laat me chillen!: first loss of any of your Mosjes.
18. Bowie & Stormey pair: both Mosjes 20 less although one was chosen.
19. Two Synergy Fields stack (+20).
20. Kleine Taks: end of the activator's turn and end of the activator's next turn.
21. Dikke Taks: only that Mosje's next attack this turn hits both.
22. Huisbaas: unaffordable searched Place stays in the deck; deck still shuffled.
23. Te Hard Gaan / Snoeiertje end-of-turn -10 skipped if that Mosje left play.
24. Varkenspootjes may target your own non-Binti Mosje (-15).
25. Welloe Force with an empty hand: can't activate.
