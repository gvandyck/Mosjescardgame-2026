# Card Reference

## Scope
This document is the final Phase 11 master card inventory, generated from the live registry and aligned with phase reports and question logs (phase1-phase10).

## Status Legend
- implemented: Fully playable in current engine and used in starter flow.
- partial: Registered and runnable, but one or more behaviors are simplified/deferred.
- advanced: Implemented but not part of the first-timer starter experience (typically booster or high-complexity pool).
- deferred: Stub exists; requires a named blocking primitive before implementation is possible (see Phase 12 Wave 5 notes).

## Card Counts
- Mosje: 34
- Piecie: 74
- Snelle Piecie: 19
- Place: 17
- Quest (General + Personal): 44

## Mosje (34)

| ID | Name | Group | Starter | Booster | Cost | Summary | Status |
|---|---|---|---|---|---|---|---|
| binti-the-creator | Binti The Creator | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| binti-the-sharp-tongue | Binti The Sharp Tongue | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| cless-the-teacher | Cless The Teacher | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| coert-kasteluck | Coert KasteLuck | ARTISTIC | no | no | free | Morning Luck (passive): at turn start roll 1d6; on 4-6 the next Piecie played that turn may activate immediately (one-shot) | advanced |
| dj-8020 | DJ 80/20 | ARTISTIC | yes | no | free | Mosje ability: +10 MP passive + questPrepBonus +2 (BUG-05 fixed: reroll redesigned as +2 Quest dice modifier) | implemented |
| jisca-the-maestro | Jisca The Maestro | ARTISTIC | yes | no | free | Perfect Combo: once per turn roll 1d6; on 5-6 choose any field Piecie and activate/re-trigger it for free; 1-4 has no effect | implemented |
| mosje_amplifier | Placeholder 3 — The Amplifier | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_chris_ddr | Dancing/DDR Chris | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_coert_kastelein | Coert Kast-elein | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_martin_driver | Martin The Precision Driver | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_tuk_architect | Tuk The Sims Architect | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| ronald-the-mastermind | Ronald The Mastermind | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| tuk-the-healing-spirit | Tuk The Healing Spirit | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| chris-the-all-rounder | Chris The All-Rounder | DIGITAL | no | no | free | Perfect Setup: once per turn with 3+ face-down Piecies, choose one and activate it for free; no MP gain | implemented |
| coert-tech-savant | Coert The Hawaiian Tech Savant | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| jeffrey-the-silent-gambler | Jeffrey The Silent Gambler | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| martin-senor-west | Martin Senor West | DIGITAL | no | no | free | Mosje ability: Calculated Guess — wrong guess routes through loseMP(); blocked at level 0+MP 0 (BUG-03 fixed) | implemented |
| martin-the-historian | Martin The Historian | DIGITAL | yes | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| ming-the-natural | Ming The Natural | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| ming-the-predictor | Ming The Predictor | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| mosje_drainer | Placeholder 4 — The Drainer | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| mosje_fps_coert | FPS Coert | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_fps_west | FPS West | DIGITAL | no | no | free | DEFERRED: opponentHandPeeked flag set; requires opponent hand reveal UI primitive in boardRenderer.js (STUB-16) | deferred |
| mosje_tactician | Placeholder 1 — The Tactician | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| ronald-the-master-chef | Ronald The Master Chef | DIGITAL | yes | no | free | DEFERRED: _ronaldPeek flag set with peeked card IDs; requires peek-reveal modal primitive (STUB-16) | deferred |
| the-hacker | The Hacker | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| youri-the-speedrunner | Youri The Speedrunner | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| alyssa-the-bulldozer | Alyssa The Bulldozer | FIGHTING | yes | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| azn-cless | AZN Cless | FIGHTING | no | no | free | Risk and Reward: manual activation, d6 even→+25 MP / odd→-15 MP, free, once/turn (2026-07-11: description previously said an auto end-of-turn 1/6-discard roll — code, not text, is the intended design; bot gates it via classifyLossSeverity, src/bot/strategy/assessQuestRisk.js). Synergy with West: Physical Quests +15 MP (wired 2026-07-11, see getPartnerSynergyQuestBonus in questLogic.js) | advanced |
| gandoe-the-destroyer | Gandoe The Destroyer | FIGHTING | no | no | free | Elimination Strike ability; synergy with Michelle: Gandoe's Physical Quest successes gain +15 MP while Michelle is on field; Michelle Tough Gamble rolls of 5-6 grant Gandoe +10 MP (MP-only, no level-up) | advanced |
| gandoe-the-wizard | Gandoe The Wizard | FIGHTING | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| jeffrey-the-strongman | Jeffrey The Strongman | FIGHTING | yes | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| michelle-iron-tuk | Michelle Iron Tuk | FIGHTING | no | no | free | Tough Gamble auto-ability: quest rewards double on 4-6 / halve on 1-3; synergy with Gandoe the Destroyer: rolls of 5-6 also grant Gandoe +10 MP, and Gandoe's Physical Quest successes gain +15 MP while Michelle is on field | advanced |
| parkour-west | Parkour West | FIGHTING | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |

## Piecie (74)

| ID | Name | Group | Starter | Booster | Cost | Summary | Status |
|---|---|---|---|---|---|---|---|
| affoe | Affoe | ATTACK | no | no | free | loseMP+gainMP; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| continuous-assault | Continuous Assault | ATTACK | no | no | free, lvl 2+ | loseMP+applyBuff; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| dikke-taks | Dikke Taks | ATTACK | yes | no | free, lvl 2+ | forEachTarget+drawCards; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| harde-didde | Harde Didde | ATTACK | no | no | free, lvl 2+ | sendToWelloe+drawCards; ruled free 2026-07-16 — "(0-40 MP)" is the target's eligible MP range, not a self-paid cost (COST-01/COST-02) | advanced |
| klaar-met-jou | Klaar Met Jou | ATTACK | no | no | free, lvl 2+ | sendToWelloe+drawCards; ruled free 2026-07-16 — "(0-30 MP)" is the target's eligible MP range, not a self-paid cost (COST-01/COST-02) | advanced |
| kleine-taks | Kleine Taks | ATTACK | no | no | free, lvl 1+ | loseMP+applyBuff; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| momentum-diefje | Momentum Diefje | ATTACK | yes | no | free, lvl 1+ | drainMP; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| mp-hemorrhage | MP Hemorrhage | ATTACK | no | no | free, lvl 2+ | loseMP+applyBuff; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| slecht-gezet | Slecht Gezet | ATTACK | no | no | free | destroyPlace | advanced |
| snoeiertje | Snoeiertje | ATTACK | yes | no | free | loseMP+applyBuff; dead SNOEIERTJE_COST push removed; questBonusMP handles real logic (STUB-08) | implemented |
| super-saiyan-mos | Super Saiyan Mos | ATTACK | no | no | free, lvl 1+ | applyBuff; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| te-hard-gaan | Te Hard Gaan | ATTACK | yes | no | free | loseMP; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| controller | Controller | DIGITAL-EQUIPMENT | yes | no | free | gainMP+ifThenElse | implemented |
| keyboard | Keyboard | DIGITAL-EQUIPMENT | yes | no | free | gainMP+drawCards | implemented |
| mouse | Mouse | DIGITAL-EQUIPMENT | yes | no | free | gainMP+ifThenElse | implemented |
| dumbbells | Dumbbells | PHYSICAL-EQUIPMENT | no | no | free | FIGHTING Mosje: +20 MP; level 3: draw 1 | implemented |
| boxing-gloves | Boxing Gloves | PHYSICAL-EQUIPMENT | no | no | free | Physical ★★+: +25 MP; GANDOE: +40 MP + MP_LOSS_HALVED 1 turn | implemented |
| skipping-rope | Skipping Rope | PHYSICAL-EQUIPMENT | no | no | free | FIGHTING: +1 quest roll + draw 1; else: draw 1 only | implemented |
| protein-shake | Protein Shake | PHYSICAL-EQUIPMENT + FOOD | no | no | free | FIGHTING: +25 MP; Boxing Ring active: +35 MP | implemented |
| chefs-special | Chef's Special | FOOD | no | no | free, lvl 1+ | ifThenElse; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| dikke-jonko | Dikke Jonko | FOOD | no | no | free | gainMP+forEachTarget+drawCards+forEachTarget | advanced |
| ronald-kip | Ronald Kip | FOOD | no | no | free | gainMP | advanced |
| varkenspootjes | Varkenspootjes | FOOD | yes | no | free | ifThenElse | implemented |
| broodje-doner | Broodje Doner | MOMENTUM-GAINING | yes | no | free | gainMP | implemented |
| pot-of-weed | Pot of Weed | MOMENTUM-GAINING | yes | no | free | drawCards | implemented |
| kannetje-melk | Kannetje Melk | MOMENTUM-GAINING | yes | no | free | gainMP | implemented |
| momentum-boost | Momentum Boost | MOMENTUM-GAINING | no | no | free | gainMP+applyBuff | advanced |
| eendjes-voeren | Eendjes voeren | MOMENTUM-GAINING | yes | no | free | ifThenElse | implemented |
| shoettoe | Shoettoe | MOMENTUM-GAINING | yes | no | free | gainMP | implemented |
| warm-kannetje-melk | Warm Kannetje Melk | MOMENTUM-GAINING | yes | no | free | loseMP+drawCards | implemented |
| bowie-stormey | Bowie & Stormey | PET | yes | no | free | applyBuff+gainMP; MP_LOSS_HALVED wired in loseMP() (STUB-01); ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| gekke-vogels | Gekke Vogels | PET | yes | no | free | applyBuff+gainMP; MP_LOSS_HALVED wired in loseMP() via Jisca ability (STUB-01); ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| katjegang | KatjeGang | PET | no | no | free | applyBuff+gainMP; MP_LOSS_HALVED wired in loseMP() via Alyssa ability (STUB-01); ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| vianna-poes | ViannaPoes | PET | no | no | free | applyBuff+gainMP; MP_LOSS_HALVED wired in loseMP() via Cless ability (STUB-01); ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| grammetje-pieter | Grammetje Pieter | SUBSTANCE | yes | no | free | gainMP+loseMP | implemented |
| larry-zegeltje | Larry Zegeltje | SUBSTANCE | no | no | free | gainMP+loseMP | advanced |
| straffoe | Straffoe | SUBSTANCE | no | no | free | loseMP+ifThenElse | advanced |
| stripje-bennies | Stripje Bennies | SUBSTANCE | no | no | free | loseMP+drawCards | advanced |
| tikker | Tikker | SUBSTANCE | yes | no | free | gainMP+applyBuff | implemented |
| afblijven | Afblijven! | UTILITY | yes | no | free | applyBuff; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| bagga-of-greed | Bagga of Greed | UTILITY | yes | no | free | drawCards+discardCards; showCardChoice modal wired in main.js — full-hand discard picker after activation (STUB-11) | implemented |
| battle-concert | Battle Concert | UTILITY | no | no | free, lvl 2+ | loseMP+ifThenElse; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| bong-hit-demolition | Bong Hit Demolition | UTILITY | no | no | free | destroyPlace+drawCards; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| piecie_boosterpackkie | Boosterpackkie | UTILITY | no | yes | free | Draw 1, roll 1d6, and draw 1 more on 5-6; a COERT-tagged Mosje also grants +10 MP | advanced |
| call-of-the-welloes | Call of the Welloes | UTILITY | no | no | free | Summon a Mosje from your Welloe pile to a free slot, restoring its recorded MP/Level. Piecie is the anchor — leaves play → Mosje returns to Welloe (end-of-turn sweep). | implemented |
| chain-reaction | Chain Reaction | UTILITY | no | no | free | multiplyByCount | advanced |
| dingetje-toch | Dingetje Toch | UTILITY | no | no | free | ifThenElse; DEFERRED to UI phase — consumption point documented in turnManager.js handleActivatePiecie() comment (STUB-07) | partial |
| piecie_dikke_plaat | Dikke Plaat | UTILITY | no | yes | free | Next Quest roll this turn +1, or +2 with a DJ-tagged Mosje; persists until end of turn | advanced |
| double-trigger | Double Trigger | UTILITY | no | no | free | applyBuff; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| dubbele-ding | Dubbele Ding | UTILITY | yes | no | free | applyBuff | implemented |
| dubbele-dosis | Dubbele Dosis | UTILITY | yes | no | free | applyBuff; persists in slot until endTurn (BUG-02 fixed: no longer discards immediately) | implemented |
| piecie_leipe_swap | Leipe Swap | UTILITY | no | yes | free, lvl 1+ | Swap one of your Mosjes' MP with an opponent Mosje's until end of turn; current MP swaps back and banked levels stay. Max rarity, 1 per deck. | implemented |
| f1-telemetry-data | F1 Telemetry Data | UTILITY | yes | no | free | ifThenElse+lookAtTop; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| huisbaas | Huisbaas | UTILITY | no | no | free | destroyPlace + return a Place from the owner's discard (Phase 17 rework — no deck-search-modal needed) | implemented |
| jantje-jantje | Jantje Jantje | UTILITY | no | no | free | loseMP+applyBuff; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| laat-me-chillen | Laat Me Chillen | UTILITY | yes | no | free | gainMP+applyBuff; MP_LOSS_REDUCTION wired in loseMP() (STUB-02); ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| piecie_loaded_dice | Loaded Dice | UTILITY | no | yes | free | Next Quest roll this turn +1, or +2 with a JEFFREY-tagged Mosje; persists until end of turn | advanced |
| mosje-reborn | Mosje Reborn | UTILITY | no | no | free | returnToHand | advanced |
| mosje-shield | Mosje Shield | UTILITY | yes | no | free | applyBuff; WELLOE_SHIELD wired in markMosjeDefeated() (STUB-03); ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| mp-adjuster | MP Adjuster | UTILITY | no | no | free | ifThenElse; showOptionSelect modal wired in main.js (20/40/60/80/100 MP); temporary effect — reverts at next turn start via startTurn(); rarity ★★★★ (STUB-15) | implemented |
| mp-amplifier | MP Amplifier | UTILITY | yes | no | free | multiplyNextMPGain | implemented |
| piecie_perfect_rhythm | Perfect Rhythm | UTILITY | no | yes | free | Next later Piecie activation this turn draws 1; exact Dancing/DDR Chris also grants +10 MP | advanced |
| perfect-setup | Perfect Setup | UTILITY | no | no | free | setMP | advanced |
| redbull | Redbull | UTILITY | yes | no | free, lvl 1+ | applyBuff; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| shhh-popo-komt | Shhh, popo komt! | UTILITY | no | no | free | destroyPlace+gainMP | advanced |
| stookerino | Stookerino | UTILITY | no | no | free, lvl 1+ | applyBuff+loseMP; ruled free 2026-07-16 — "Gain MP = that card's cost" refers to the discarded opponent card's mpCost as a gain formula input, not a self-paid cost for playing Stookerino itself (COST-01/COST-02) | advanced |
| synergy-field | Synergy Field | UTILITY | yes | no | free | applyBuff+gainMP; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| tempiecie | TemPiecie | UTILITY | no | no | free, lvl 1+ | returnToHand+applyBuff; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| those-eyelashes-tho | Those Eyelashes Tho... | UTILITY | no | no | free, lvl 1+ | gainMP+forEachTarget; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| tweede-kans | Tweede Kans | UTILITY | no | no | free | rerollDie; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| welloe-force | Welloe Force | UTILITY | no | no | 40 MP, lvl 1+ | Pay 40 MP tribute — player picks which Mosje pays via showTributePayerSelect, blocked entirely if no Mosje can afford it; 3-turn damage redirect (reworked 2026-07-16, closes the prior hardcoded-first-slot + no-affordability-check bugs) | implemented |
| zie-je-die-dingetjes | Zie Je Die Dingetjes | UTILITY | no | no | free | lookAtTop+drawCards | implemented |

### Thematic Item Notes
- Coert The Hawaiian Tech Savant's thematic item is the existing Keyboard Piecie; no duplicate card is needed.
- Coert Kast-elein remains disabled and hidden, and Chris The All-Rounder intentionally has no dedicated item.

## Snelle Piecie (19)

| ID | Name | Group | Starter | Booster | Cost | Summary | Status |
|---|---|---|---|---|---|---|---|
| snelle_bijna_welloe | Bijna Welloe | - | yes | no | free | negateEffect+ifThenElse | implemented |
| snelle_blensen | Blensen! | - | no | no | free | negateEffect+applyBuff (ruled free 2026-07-16 — "Free if countering a Frenssen" never states an actual cost value or self-payment language elsewhere in its text) | implemented |
| snelle_counter_strikka | Counter Strikka | - | yes | no | free | negateEffect+ifThenElse; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| snelle_drain_reversal | Drain Reversal | - | no | no | free | negateEffect+gainMP; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| snelle_dubbele_temminks | Dubbele Temminks | - | yes | no | free | applyBuff; doubleNextPiecie confirmed implemented in activatePiecie() (STUB-05); ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| snelle_emergency_healings | Emergency Healings | - | no | no | 10 MP | ifThenElse | advanced |
| snelle_ff_haaltje_nemen | FF Haaltje Nemen | - | no | no | free | ifThenElse; ReferenceError fixed + MP_LOSS_REDUCTION value restored (20/30) + wired in loseMP() (STUB-02, STUB-06) | implemented |
| snelle_frenssen | Frenssen! | - | no | no | free | negateEffect+loseMP; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | advanced |
| snelle_gevalletje_klakkeloos | Gevalletje Klakkeloos | - | no | no | free | gainMP | advanced |
| snelle_jammertje_gepakt | Jammertje Gepakt | - | no | no | free | negateEffect+sendToBottomOfDeck+ifThenElse; negateNextSearch guard wired in phaseDrawCard() (STUB-04); ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| snelle_jantje_jantje_jantje | Jantje Jantje Jantje… | - | no | no | discard 1 | negateEffect | implemented |
| snelle_jensen | Jensen! | - | yes | no | 10 MP | negateEffect+discardSourceCard | advanced |
| snelle_jeweetniet | Jeweetniet wie Ikben | - | no | no | 10 MP | applyBuff | advanced |
| snelle_lucky_coin | Lucky Cóin | - | yes | no | 10 MP | ifThenElse; slot guard blocks activation when all 4 slots full (BUG-04 fixed) | implemented |
| snelle_negate_elimination | Not Today | - | yes | no | free | negateEffect; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| snelle_perfect_dodge | Perfect Dodge | - | no | no | free | ifThenElse; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| snelle_sleutelpuntje | Sleutelpuntje | - | yes | no | free | choose; ruled free 2026-07-16, no self-payment language (COST-01/COST-02) | implemented |
| snelle_the_protector | The Protector | - | no | no | free | reduceMPLossBy; mpLossReduction snelle flag consolidated into loseMP() read point (STUB-02) | implemented |
| momentum-rush | Momentum Rush | MOMENTUM-GAINING | no | no | free | gainMP+drawCards | advanced |

## Place (19 of 21 — place_tesla and place_eendjes_voeren rows still missing, pre-existing gap outside Phase 35's scope)

| ID | Name | Group | Starter | Booster | Cost | Effect (aligned) | Status |
|---|---|---|---|---|---|---|---|
| place_arcade | Arcade | PLACE | yes | no | free | quest_completed, Technical 2+, +15 MP, ALL active slots (fixed 2026-07-14: was first-slot-only) | implemented |
| place_boxing_ring | Boxing Ring | PLACE | no | no | free | END_PHASE: FIGHTING +10 MP, non-FIGHTING -5 MP; ON_QUEST: Physical +15 MP (GANDOE: +25 MP) | implemented |
| place_bank_chilling | Bank Chilling | PLACE | yes | no | free | turn_start (START_PHASE), Social 2+, +15 MP, ALL active slots (fixed 2026-07-14: was first-slot-only AND a dead trigger string — card had never fired in live play) | implemented |
| place_coerts_caravan | Coert's Caravan | PLACE | yes | no | free | REWORKED 2026-07-18: passive while active, Coert Mosjes ignore up to 40 MP of Quest damage each turn; quest attempt costs and non-Quest damage are not prevented | implemented |
| place_de_box | De Box | PLACE | no | no | free | end_phase, GANDOE +20 MP, MICHELLE/TUK-family +15 MP (fixed 2026-07-14: widened id match to include all Tuk-family Mosjes, not just Michelle; fixed stale "Toennoe" log strings to say "De Box"), +10 bonus each if both present | implemented |
| place_delluft | Delluft | PLACE | no | no | free | turn_end, all draw 1 card (SUBSTANCE cost-0 MP clause trimmed 2026-07-16 — now vacuous since all referenced SUBSTANCE Piecies are unconditionally free per Phase 36's audit) | advanced |
| place_digital_gaming_stop | Digital Gaming Stop | PLACE | no | yes | free | REPLACED 2026-07-14: on_quest, DIGITAL-EQUIPMENT Piecie active → +10 MP to questing Mosje (dropped the old dead auto-succeed flag, which had zero consumers) | implemented |
| place_dierenasiel | Dierenasiel | PLACE | no | no | free | passive; +25% PET-protection clause removed 2026-07-14 (was permanently inert due to a setter/reader typo mismatch); PET cost-0 MP clause trimmed 2026-07-16 (now vacuous — all PET Piecies unconditionally free per Phase 36's audit); currently no mechanical effect, real passive mechanic deferred to a future phase | advanced |
| place_drain_zone | Drain Zone | PLACE | no | no | free | turn_end, lowest MP Mosje loses -10 MP; ATTACK Piecie +10 damage bonus DESCOPED to a future Piecie-touching phase; untexted +5-all-gains bug removed 2026-07-14; hidden from deck-building/boosters as of 2026-07-14 | advanced |
| place_momentum_factory | Momentum Factory | PLACE | no | no | free | piecie_activated, +10 MP (first-only enforced in UI) | advanced |
| place_momentum_stabilizer | Momentum Stabilizer | PLACE | no | no | free | passive flag only; 30 MP loss cap enforced in UI | advanced |
| place_obby_1 | Obby #1 | PLACE | yes | no | free | quest_completed/failed, Physical 2+ or Resilient 2+, +20/-10 MP, ALL active slots (fixed 2026-07-14: was first-slot-only) | implemented |
| place_quest_haven | Quest Haven | PLACE | yes | no | free | quest_completed, +10 MP; 2-quest bonus +25 MP (UI tracked) | implemented |
| place_skiffa | Skiffa | PLACE | no | no | free | REWORKED 2026-07-14: on_quest, Social quests +2 dice roll for all players (was turn_end discard/-15 MP, discard branch was never built; also removed the undocumented getSkiffaRerolls ARTISTIC-creative reroll grant) | implemented |
| place_synergy_chamber | Synergy Chamber | PLACE | no | no | free | REWORKED 2026-07-14: once/turn, activate a synergy-gated bonus (Binti+Coert FOOD double, or Señor West+AZN Cless Physical-quest bonus) without the partner Mosje present; the old undocumented cost-5/dice+1/duration+1 bonuses are removed | implemented |
| place_the_gym | The Gym | PLACE | yes | no | free | END_PHASE (fires per player-turn, both sides): Physical ★★★ +35 MP, Physical ★★ +25 MP, CLESS +20 MP, WEST neutral (2026-07-11 balance fix — was punished at -10 like any other non-Physical Mosje, draining WC's own team; now matches his no-op treatment at Obby #1), else -10 MP | implemented |
| place_the_void | The Void | PLACE | no | no | free | turn_end, all -15 MP; RESTORE/FOOD restriction via activatePiecie guard (unchanged, already correctly wired); one-card-per-turn activation cap DESCOPED to a future dedicated design phase; untexted quest-MP-nullify gate removed 2026-07-14 (was fully redundant with mpManager.js's own place_the_void gates); hidden from deck-building/boosters as of 2026-07-14 | advanced |
| place_welloe_graveyard | Welloe Graveyard | PLACE | no | no | free | mosje_defeated, +20 MP + draw 1 card for that player | advanced |
| place_zo_is_natuur | Zo is Natuur | PLACE | yes | no | free | turn_end, Resilient 1+→+15 MP, else +10 MP | implemented |

### Place Design Notes
- **Digital Gaming Stop**: (2026-07-14) fully implemented — see table row above; the old "hidden, no engine implementation" note is stale.
- **Dierenasiel**: (2026-07-14) its +25% PET-protection clause was removed as permanently-dead code (setter/reader typo mismatch, never reachable); its "PET Piecies cost 0 MP" clause was trimmed 2026-07-16 (Phase 36) as vacuous — see table row above. Dierenasiel currently has no mechanical effect; a real passive mechanic is deferred to a future phase (`.planning/todos/pending/2026-07-16-dierenasiel-real-mechanic-needed.md`).
- **Quest Haven**: 2-quest-per-turn bonus (+25 MP) tracked in browser only via `questsCompletedThisTurn` counter; TS engine fires +10 MP per quest_completed event.
- **Momentum Factory**: TS engine fires +10 MP per piecie_activated event; browser enforces "first Piecie only" restriction via `pieciesPlayedThisTurn` counter.

## Quest (44)

| ID | Name | Group | Starter | Booster | Cost | Summary | Status |
|---|---|---|---|---|---|---|---|
| quest_arm_wrestling | Arm Wrestling | general | no | no | free | Quest success effects: gainMP | advanced |
| quest_artistic_expression | Artistic Expression | general | yes | no | free | auto-succeed Creative ★★+; draws 2 on success (drawOnSuccess, Phase 21) | implemented |
| quest_build_gadget | Build Gadget | general | no | no | free | Quest success effects: gainMP | implemented |
| quest_calculate_odds | Calculate Odds | general | no | no | free | Quest success effects: gainMP | implemented |
| quest_chain_master | Chain Master | general | no | no | free | roll 3+ with 3+ Piecies in discard; this-turn tracking DEFERRED | implemented |
| quest_create_masterpiece | Create Masterpiece | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_debug_system | Debug System | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_elimination_challenge | Elimination Challenge | general | no | no | free | roll 4+; opponent's first active Mosje loses 30 MP on success (opponentLoseMP, Phase 21; skipped under The Void) | implemented |
| quest_endurance_test | Endurance Test | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_endure_pain | Endure Pain | general | no | no | free | Quest success effects: gainMP | implemented |
| quest_form_alliance | Form Alliance | general | no | no | free | Quest success effects: drainMP+gainMP | implemented |
| quest_geen_raad_vraag_aad | Geen Raad? Vraag Aad! | general | no | no | free | full pick→guess→reveal card-guess flow live in main.js | implemented |
| quest_hack_mainframe | Hack Mainframe | general | yes | no | free | Quest success effects: gainMP; Hacker/FPS -1 threshold now fires (reads cardId, Phase 21) | implemented |
| quest_improvise | Improvise! | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_inspire_crowd | Inspire Crowd | general | no | no | free | Quest success effects: gainMP | advanced |
| quest_larry_temmen | Larry Temmen Niemand Zeggen | general | no | no | free | SIMPLIFIED: roll 5+ = success (3-way outcome DEFERRED) | implemented |
| quest_late_night_questing | Late Night Questing | general | no | no | free | roll 3+; draws 2 on success (drawOnSuccess, Phase 21) | implemented |
| quest_leap_of_faith | Leap of Faith | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_lucky_break | Lucky Break | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_master_plan | Master Plan | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_momentum_master | Momentum Master | general | no | no | free | Quest success effects: gainMP | advanced |
| quest_negotiation | Negotiation | general | no | no | free | Quest success effects: gainMP | implemented |
| quest_never_give_up | Never Give Up | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_parkeren_delft | Parkeren Delft | general | no | no | free | Quest success effects: loseMP+gainMP | implemented |
| quest_parkour_challenge | Parkour Challenge | general | no | no | free | Quest success effects: loseMP+gainMP | advanced |
| quest_perfect_timing | Perfect Timing | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_precision_work | Precision Work | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_quick_thinking | Quick Thinking | general | no | no | free | Quest success effects: gainMP | advanced |
| quest_regelaar | Regelaar | general | no | no | free | Quest success effects: gainMP | implemented |
| quest_shotje_obby | Shotje Obby | general | yes | no | free | roll 4+; auto-succeed at place_obby_1 (place ID bug fixed) | implemented |
| quest_speed_run | Speed Run | general | yes | no | free | SIMPLIFIED: first-action gate removed; roll Technical-scaled (DEFERRED) | implemented |
| quest_sprint_race | Sprint Race | general | no | no | free | Quest success effects: gainMP | advanced |
| quest_strategy_puzzle | Strategy Puzzle | general | yes | no | free | Quest success effects: discardCards+gainMP; both threshold paths agree (BUG-01: runtime debug log added to main.js:541 — stale activeMosje suspected) | implemented |
| quest_survive_storm | Survive Storm | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_sustained_assault | Sustained Assault | general | yes | no | free | SIMPLIFIED: ATTACK gate removed; Physical-scaled roll (DEFERRED) | implemented |
| quest_synergy_mastery | Synergy Mastery | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_team_building | Team Building | general | no | no | free | Quest success effects: gainMP | advanced |
| quest_the_gauntlet | The Gauntlet | general | no | no | free | Quest success effects: gainMP | implemented |
| quest_tough_it_out | Tough It Out | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_ultimate_challenge | Ultimate Challenge | general | no | no | free | Quest success effects: loseMP+gainMP | implemented |
| quest_personal_iron_will | Iron Will | personal | no | yes | free | Quest success effects: gainMP | advanced |
| quest_personal_lucky_crescendo | Lucky Crescendo | personal | no | yes | free | Quest success effects: gainMP+forEachTarget | advanced |
| quest_personal_perfect_sync | Perfect Sync | personal | no | yes | free | Quest success effects: gainMP | advanced |
| quest_west_perfect_read | Perfect Read | personal | no | yes | free | Quest success effects: gainMP | advanced |

### Quest Design Notes
- **Attempt affordability gate (Phase 37, 2026-07-16):** attempting a General or Personal Quest in the human UI is affordability-gated — a Mosje with less than 20 MP cannot start an attempt (its picker option renders disabled), closing a self-destruct where a sub-20-MP Mosje could be charged the flat quest-attempt fee and driven below 0. The 20 MP fee itself and its lethality below 0 at Level 0 remain canonical (`docs/phase0-rulings.md:126`) and are unchanged — this phase adds only the pre-attempt gate.

## Deferred Features and Simplifications

### Phase 4 Questions
- zie-je-die-dingetjes: ✅ resolved in Phase 8 (plan 08-03) — full two-call peek+keep pattern implemented.
- call-of-the-welloes: ✅ resolved in Phase 22 (plan 22-01 through 22-03) — summon/restore/return-to-Welloe fully implemented.
- dingetje-toch: flag set; consumption in piecie requirement check deferred to UI layer (documented in turnManager.js plan 08-03).
- double-trigger: executor-level double activation still deferred.

### Phase 5 Questions
- snelle_jammertje_gepakt: send-to-bottom primitive deferred — reclassified `advanced`.
- snelle_drain_reversal: ✅ resolved in Phase 8 (plan 08-04) — drain reflects to opponent in loseMP.
- snelle_jantje_jantje_jantje: ✅ resolved in Phase 8 (plan 08-02) — const→let crash fixed; steal works when Bank Chilling active.
- snelle_jensen: source-card discard on negate deferred — reclassified `advanced`; +20 MP gain is approved Phase 5 simplification.
- snelle_jeweetniet: force-reroll flag set correctly; consumption in questLogic confirmed; reclassified `advanced` as force-reroll interception is UI-layer deferred.
- snelle_counter_strikka: ✅ resolved in Phase 8 (plan 08-04) — DRAIN damage negated in loseMP.
- snelle_perfect_dodge: ✅ resolved in Phase 8 (plan 08-04) — ATTACK negated + +15 MP in loseMP.
- snelle_frenssen: counter-chain push implemented; caller targetRef resolution deferred to UI — reclassified `advanced`.
- snelle_blensen: ✅ resolved in Phase 8 (plan 08-02) — free-cost flag set when countering Frenssen.

### Phase 6 Questions
- Multiple quests still use OR-condition, event-log, or interactive simplifications (see listed partial quest cards in table).
- quest_form_alliance requires caller-provided targetRef in multiplayer/UI layer.

### Phase 7 Questions
- place_synergy_chamber keeps forced-synergy support; duration extension and ability-cost reduction remain deferred. **(2026-07-14 update, Phase 35: this framing is now stale — the cost/dice/duration bonuses described here were undocumented dead code and have been removed entirely; Synergy Chamber's real mechanic is now a once-per-turn synergy-partner waiver — see the Place table row above.)**

### Phase 8 Questions
- Plans 08-01 through 08-04 resolved most partial cards (see ✅ notes above and in Phase 5 section).
- Remaining partial/advanced cards: mosje_fps_west (UI peek reveal), ronald-the-master-chef (UI hand reveal), place_synergy_chamber (2026-07-14: reworked into a once-per-turn synergy-partner waiver, no longer cost/duration-reduction — see Place table row above), place_dierenasiel (2026-07-16, Phase 36: PET cost-0 MP clause trimmed as vacuous, not implemented — currently no mechanical effect, real passive mechanic deferred to a future phase — see Place table row above), dingetje-toch (requirement bypass UI), double-trigger (double-fire executor), snelle_frenssen (UI targetRef), snelle_jammertje_gepakt (send-to-bottom primitive), snelle_jensen (source-card discard), snelle_jeweetniet (force-reroll interception UI).
- Quest section: see plan 08-06 for full quest audit and classification.

### Phase 10 Notes
- Leipe Swap became an implemented max-rarity swap card in Phase 20.
- Post-balance simulation reduced never-played cards from 36 to 21 but did not eliminate all advanced/deferred mechanics.

### Phase 12 Notes (Unfinished Stubs Audit — Waves 1–5)
**Implemented (stubs now fully wired):**
- STUB-01: MP_LOSS_HALVED wired in loseMP() — Bowie & Stormey, Gekke Vogels, KatjeGang, ViannaPoes, Tony all functional
- STUB-02: MP_LOSS_REDUCTION wired in loseMP() — Laat me chillen, FF Haaltje Nemen, The Protector all functional
- STUB-03: WELLOE_SHIELD wired in markMosjeDefeated() — Mosje Shield prevents knockout
- STUB-04: negateNextSearch guard wired in phaseDrawCard() — Jammertje Gepakt cancels opponent draws
- STUB-05: doubleNextPiecie confirmed already implemented in activatePiecie() — Dubbele Temminks functional
- STUB-06: effect_ff_haaltje_nemen ReferenceError fixed; value restored (20/30)
- STUB-08: Dead SNOEIERTJE_COST push removed from effect_snoeiertje
- STUB-10 (Synergy Chamber ability-cost pre-adjustment): **SUPERSEDED 2026-07-14 (Phase 35) — the wired mechanic this entry described was undocumented dead code with no basis in the card's text and has been fully removed. Synergy Chamber's real mechanic is now a once-per-turn synergy-partner waiver; see the Place table.**
- STUB-11: Bagga of Greed — showCardChoice modal wired in main.js; full-hand discard picker after activation
- STUB-14: Welloe Force — showOptionSelect modal + 3-turn engine-level damage redirect in loseMP()
- STUB-15: MP Adjuster — showOptionSelect modal (20/40/60/80/100 MP); temporary, reverts at startTurn()

**Partial (engine done, UI deferred):**
- STUB-07: Dingetje Toch — engine flag set; UI consumption point documented in turnManager.js handleActivatePiecie()
- Dierenasiel engine guard (formerly tracked as a STUB entry): **SUPERSEDED 2026-07-14 (Phase 35) — the guard this referenced was dead code (typo'd setter/reader mismatch, never reachable) and has been removed. PET cost-0 MP clause trimmed 2026-07-16 (Phase 36) as vacuous — Dierenasiel currently has no mechanical effect; real passive mechanic deferred to a future phase.**

**Deferred (requires named blocking primitive):**
- STUB-16: FPS West — blocking primitive: opponent hand reveal UI in boardRenderer.js (opponentHandPeeked flag)
- STUB-16: Ronald Chef — blocking primitive: peek-reveal modal showing top 2 deck card names (_ronaldPeek flag)

### Phase 22 Notes (Call of the Welloes — full implementation)

- returnMosjeToWelloe primitive added to turnManager.js; endTurn sweep returns Mosjes linked by summonedByPiecie === 'piecie_call_of_welloes' when the anchor Piecie is gone
- confirmCallOfWelloes restores mp/level/traits/statusEffects from welloe archive record
- effect_call_of_welloes: empty-welloe / no-free-slot guards produce silent cancel; _callOfWelloesPending on success
- main.js handleActivatePiecie: _callOfWelloesPending branch → showOptionSelect modal → confirmCallOfWelloes → silent _callOfWelloesCancel cleanup
- All three waves TDD RED-then-GREEN; 896 tests passing; 100-game sim 0 crashes

### Phase 14 Notes (Physical Equipment Cards & Boxing Ring)

- Added 4 PHYSICAL-EQUIPMENT Piecies: Dumbbells, Boxing Gloves, Skipping Rope, Protein Shake
- Added 1 new Place: Boxing Ring (END_PHASE + ON_QUEST dual trigger via resolvePlaceEffect bypass)
- Updated The Gym: CLESS-tagged Mosjes gain +20 MP instead of losing 10 MP (PHYS-06)
- Boxing Gloves: GANDOE path pushes MP_LOSS_HALVED turnsLeft:1 (consumed by mpManager.js / loseMP())
- Protein Shake: bonus tier (+35 MP) when activePlace === 'place_boxing_ring' (vs +25 MP base)
- Boxing Ring bypass placed before trigger guard in resolvePlaceEffect — handles both ON_QUEST and END_PHASE without switch case

### 2026-07-11 Notes (West & Cless deck investigation — 3 stacked fixes)

Found while investigating why DUO_WEST_CLESS underperformed (27.5% in the 100-game deck-matrix sim). Branches: `fix/azn-cless-risk-reward` → `card/west-cless-physical-synergy` → `balance/the-gym-west-exemption`.

- **AZN Cless bug**: `abilityDescription` claimed an automatic, mostly-harmless end-of-turn roll; the actual `ability_azn_cless_risk_reward` implementation is a manually-activated, zero-cost, fixed 50/50 gamble (even→+25 MP, odd→-15 MP). Since it has no MP cost, the bot's only ability gate never applied — it fired blind almost every turn. Description text corrected to match the code (kept as the source of truth per this doc's own "verify against code" convention); bot now gates it via `classifyLossSeverity`/`getRequiredConfidence` (extracted from `assessQuestRisk.js`, reused — same risk vocabulary as quest attempts).
- **Dormant synergy bonus wired up**: `getActiveSynergies()`/`hasSynergy()` (synergyResolver.js) was only ever consumed by the hardcoded Binti+Coert FOOD-double check — West+Cless's declared "Physical Quests give +15 bonus MP" synergy never mechanically applied. New `getPartnerSynergyQuestBonus()` in questLogic.js (data-driven, one table entry) wires it into `resolveQuest`. While there, also fixed `player.questBonusMP` (armed by snoeiertje, super-saiyan-mos, momentum-boost, f1-telemetry-data — see STUB-08 above) — the "next successful Quest gives this bonus MP" comment was accurate about intent but `resolveQuest` never actually read the field. Both bonuses now apply together on success, questBonusMP resetting only when consumed (a failed attempt keeps it armed for the next try).
- **The Gym balance tweak**: see place_the_gym row above — West no longer takes environmental damage from his own deck's Place card.

Full details: `docs/phase0-rulings.md` is unchanged (these are card/place-level fixes, not universal-rule changes).
