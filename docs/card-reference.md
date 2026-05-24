# Card Reference

## Scope
This document is the final Phase 11 master card inventory, generated from the live registry and aligned with phase reports and question logs (phase1-phase10).

## Status Legend
- implemented: Fully playable in current engine and used in starter flow.
- partial: Registered and runnable, but one or more behaviors are simplified/deferred.
- advanced: Implemented but not part of the first-timer starter experience (typically booster or high-complexity pool).

## Card Counts
- Mosje: 34
- Piecie: 64
- Snelle Piecie: 19
- Place: 16
- Quest (General + Personal): 44

## Mosje (34)

| ID | Name | Group | Starter | Booster | Cost | Summary | Status |
|---|---|---|---|---|---|---|---|
| binti-the-creator | Binti The Creator | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| binti-the-sharp-tongue | Binti The Sharp Tongue | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| cless-the-teacher | Cless The Teacher | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| coert-kasteluck | Coert KasteLuck | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| dj-8020 | DJ 80/20 | ARTISTIC | yes | no | free | Mosje ability: +10 MP passive + questPrepBonus +2 (BUG-05 fixed: reroll redesigned as +2 Quest dice modifier) | implemented |
| jisca-the-maestro | Jisca The Maestro | ARTISTIC | yes | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_amplifier | Placeholder 3 — The Amplifier | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_chris_ddr | Dancing/DDR Chris | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_coert_kastelein | Coert Kast-elein | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_martin_driver | Martin The Precision Driver | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_tuk_architect | Tuk The Sims Architect | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| ronald-the-mastermind | Ronald The Mastermind | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| tuk-the-healing-spirit | Tuk The Healing Spirit | ARTISTIC | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| chris-the-all-rounder | Chris The All-Rounder | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| coert-tech-savant | Coert The Hawaiian Tech Savant | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| jeffrey-the-silent-gambler | Jeffrey The Silent Gambler | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| martin-senor-west | Martin Senor West | DIGITAL | no | no | free | Mosje ability: Calculated Guess — wrong guess routes through loseMP(); blocked at level 0+MP 0 (BUG-03 fixed) | implemented |
| martin-the-historian | Martin The Historian | DIGITAL | yes | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| ming-the-natural | Ming The Natural | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| ming-the-predictor | Ming The Predictor | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| mosje_drainer | Placeholder 4 — The Drainer | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| mosje_fps_coert | FPS Coert | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| mosje_fps_west | FPS West | DIGITAL | no | no | free | opponentHandPeeked flag set; full hand reveal requires UI layer integration | partial |
| mosje_tactician | Placeholder 1 — The Tactician | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| ronald-the-master-chef | Ronald The Master Chef | DIGITAL | yes | no | free | _ronaldPeek metadata set with playerId+timestamp; full opponent hand reveal requires UI layer integration | partial |
| the-hacker | The Hacker | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| youri-the-speedrunner | Youri The Speedrunner | DIGITAL | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| alyssa-the-bulldozer | Alyssa The Bulldozer | FIGHTING | yes | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| azn-cless | AZN Cless | FIGHTING | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| gandoe-the-destroyer | Gandoe The Destroyer | FIGHTING | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| gandoe-the-wizard | Gandoe The Wizard | FIGHTING | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| jeffrey-the-strongman | Jeffrey The Strongman | FIGHTING | yes | no | free | Mosje ability defined in execute-mosje-ability flow | implemented |
| michelle-iron-tuk | Michelle Iron Tuk | FIGHTING | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |
| parkour-west | Parkour West | FIGHTING | no | no | free | Mosje ability defined in execute-mosje-ability flow | advanced |

## Piecie (64)

| ID | Name | Group | Starter | Booster | Cost | Summary | Status |
|---|---|---|---|---|---|---|---|
| affoe | Affoe | ATTACK | no | no | 5 MP | loseMP+gainMP | advanced |
| continuous-assault | Continuous Assault | ATTACK | no | no | 20 MP, lvl 2+ | loseMP+applyBuff | advanced |
| dikke-taks | Dikke Taks | ATTACK | yes | no | 25 MP, lvl 2+ | forEachTarget+drawCards | implemented |
| harde-didde | Harde Didde | ATTACK | no | no | 40 MP, lvl 2+ | sendToWelloe+drawCards | advanced |
| klaar-met-jou | Klaar Met Jou | ATTACK | no | no | 25 MP, lvl 2+ | sendToWelloe+drawCards | advanced |
| kleine-taks | Kleine Taks | ATTACK | no | no | 15 MP, lvl 1+ | loseMP+applyBuff | advanced |
| momentum-diefje | Momentum Diefje | ATTACK | yes | no | 15 MP, lvl 1+ | drainMP | implemented |
| mp-hemorrhage | MP Hemorrhage | ATTACK | no | no | 25 MP, lvl 2+ | loseMP+applyBuff | advanced |
| slecht-gezet | Slecht Gezet | ATTACK | no | no | free | destroyPlace | advanced |
| snoeiertje | Snoeiertje | ATTACK | yes | no | free | loseMP+applyBuff | implemented |
| super-saiyan-mos | Super Saiyan Mos | ATTACK | no | no | 15 MP, lvl 1+ | applyBuff | advanced |
| te-hard-gaan | Te Hard Gaan | ATTACK | yes | no | 15 MP | loseMP | implemented |
| controller | Controller | DIGITAL-EQUIPMENT | yes | no | free | gainMP+ifThenElse | implemented |
| keyboard | Keyboard | DIGITAL-EQUIPMENT | yes | no | free | gainMP+drawCards | implemented |
| mouse | Mouse | DIGITAL-EQUIPMENT | yes | no | free | gainMP+ifThenElse | implemented |
| chefs-special | Chef's Special | FOOD | no | no | 10 MP, lvl 1+ | ifThenElse | advanced |
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
| bowie-stormey | Bowie & Stormey | PET | yes | no | 15 MP | applyBuff+gainMP | implemented |
| gekke-vogels | Gekke Vogels | PET | yes | no | 15 MP | applyBuff+gainMP | implemented |
| katjegang | KatjeGang | PET | no | no | 15 MP | applyBuff+gainMP | advanced |
| vianna-poes | ViannaPoes | PET | no | no | 15 MP | applyBuff+gainMP | advanced |
| grammetje-pieter | Grammetje Pieter | SUBSTANCE | yes | no | free | gainMP+loseMP | implemented |
| larry-zegeltje | Larry Zegeltje | SUBSTANCE | no | no | free | gainMP+loseMP | advanced |
| straffoe | Straffoe | SUBSTANCE | no | no | free | loseMP+ifThenElse | advanced |
| stripje-bennies | Stripje Bennies | SUBSTANCE | no | no | free | loseMP+drawCards | advanced |
| tikker | Tikker | SUBSTANCE | yes | no | free | gainMP+applyBuff | implemented |
| afblijven | Afblijven! | UTILITY | yes | no | 10 MP | applyBuff | implemented |
| bagga-of-greed | Bagga of Greed | UTILITY | yes | no | free | drawCards+discardCards | implemented |
| battle-concert | Battle Concert | UTILITY | no | no | 25 MP, lvl 2+ | loseMP+ifThenElse | advanced |
| bong-hit-demolition | Bong Hit Demolition | UTILITY | no | no | 10 MP | destroyPlace+drawCards | advanced |
| call-of-the-welloes | Call of the Welloes | UTILITY | no | no | free | returnToHand stub; intended linked Welloe summon | partial |
| chain-reaction | Chain Reaction | UTILITY | no | no | free | multiplyByCount | advanced |
| dingetje-toch | Dingetje Toch | UTILITY | no | no | free | ifThenElse | partial |
| double-trigger | Double Trigger | UTILITY | no | no | 20 MP | applyBuff | partial |
| dubbele-ding | Dubbele Ding | UTILITY | yes | no | free | applyBuff | implemented |
| dubbele-dosis | Dubbele Dosis | UTILITY | yes | no | free | applyBuff; persists in slot until endTurn (BUG-02 fixed: no longer discards immediately) | implemented |
| emergency-swap | Emergency Swap | UTILITY | no | no | 30 MP, lvl 1+ | switchActiveMosje+applyBuff | advanced |
| f1-telemetry-data | F1 Telemetry Data | UTILITY | yes | no | 10 MP | ifThenElse+lookAtTop | implemented |
| huisbaas | Huisbaas | UTILITY | no | no | free | destroyPlace+ifThenElse | advanced |
| jantje-jantje | Jantje Jantje | UTILITY | no | no | 15 MP | loseMP+applyBuff | advanced |
| laat-me-chillen | Laat Me Chillen | UTILITY | yes | no | 10 MP | gainMP+applyBuff | implemented |
| mosje-reborn | Mosje Reborn | UTILITY | no | no | free | returnToHand | advanced |
| mosje-shield | Mosje Shield | UTILITY | yes | no | 10 MP | applyBuff | implemented |
| mp-adjuster | MP Adjuster | UTILITY | no | no | free | ifThenElse | advanced |
| mp-amplifier | MP Amplifier | UTILITY | yes | no | free | multiplyNextMPGain | implemented |
| perfect-setup | Perfect Setup | UTILITY | no | no | free | setMP | advanced |
| redbull | Redbull | UTILITY | yes | no | 20 MP, lvl 1+ | applyBuff | implemented |
| shhh-popo-komt | Shhh, popo komt! | UTILITY | no | no | free | destroyPlace+gainMP | advanced |
| stookerino | Stookerino | UTILITY | no | no | 10 MP, lvl 1+ | applyBuff+loseMP | advanced |
| synergy-field | Synergy Field | UTILITY | yes | no | 15 MP | applyBuff+gainMP | implemented |
| tempiecie | TemPiecie | UTILITY | no | no | 15 MP, lvl 1+ | returnToHand+applyBuff | advanced |
| those-eyelashes-tho | Those Eyelashes Tho... | UTILITY | no | no | 15 MP, lvl 1+ | gainMP+forEachTarget | advanced |
| tweede-kans | Tweede Kans | UTILITY | no | no | 5 MP | rerollDie | advanced |
| welloe-force | Welloe Force | UTILITY | no | no | 10 MP, lvl 1+ | forEachTarget+drawCards | advanced |
| zie-je-die-dingetjes | Zie Je Die Dingetjes | UTILITY | no | no | free | lookAtTop+drawCards | implemented |

## Snelle Piecie (19)

| ID | Name | Group | Starter | Booster | Cost | Summary | Status |
|---|---|---|---|---|---|---|---|
| snelle_bijna_welloe | Bijna Welloe | - | yes | no | free | negateEffect+ifThenElse | implemented |
| snelle_blensen | Blensen! | - | no | no | variable | negateEffect+applyBuff | implemented |
| snelle_counter_strikka | Counter Strikka | - | yes | no | 15 MP | negateEffect+ifThenElse | implemented |
| snelle_drain_reversal | Drain Reversal | - | no | no | 15 MP | negateEffect+gainMP | implemented |
| snelle_dubbele_temminks | Dubbele Temminks | - | yes | no | 20 MP | applyBuff | implemented |
| snelle_emergency_healings | Emergency Healings | - | no | no | 10 MP | ifThenElse | advanced |
| snelle_ff_haaltje_nemen | FF Haaltje Nemen | - | no | no | free | ifThenElse | advanced |
| snelle_frenssen | Frenssen! | - | no | no | 15 MP | negateEffect+loseMP | advanced |
| snelle_gevalletje_klakkeloos | Gevalletje Klakkeloos | - | no | no | free | gainMP | advanced |
| snelle_jammertje_gepakt | Jammertje Gepakt | - | no | no | 20 MP | negateEffect+sendToBottomOfDeck+ifThenElse | advanced |
| snelle_jantje_jantje_jantje | Jantje Jantje Jantje… | - | no | no | discard 1 | negateEffect | implemented |
| snelle_jensen | Jensen! | - | yes | no | 10 MP | negateEffect+discardSourceCard | advanced |
| snelle_jeweetniet | Jeweetniet wie Ikben | - | no | no | 10 MP | applyBuff | advanced |
| snelle_lucky_coin | Lucky Cóin | - | yes | no | 10 MP | ifThenElse; slot guard blocks activation when all 4 slots full (BUG-04 fixed) | implemented |
| snelle_negate_elimination | Not Today | - | yes | no | 20 MP | negateEffect | implemented |
| snelle_perfect_dodge | Perfect Dodge | - | no | no | 20 MP | ifThenElse | implemented |
| snelle_sleutelpuntje | Sleutelpuntje | - | yes | no | 5 MP | choose | implemented |
| snelle_the_protector | The Protector | - | no | no | free | reduceMPLossBy | advanced |
| momentum-rush | Momentum Rush | MOMENTUM-GAINING | no | no | free | gainMP+drawCards | advanced |

## Place (16)

| ID | Name | Group | Starter | Booster | Cost | Effect (aligned) | Status |
|---|---|---|---|---|---|---|---|
| place_arcade | Arcade | PLACE | yes | no | free | quest_completed, Technical 2+, +15 MP | implemented |
| place_bank_chilling | Bank Chilling | PLACE | yes | no | free | turn_start, Social 2+, +15 MP | implemented |
| place_coerts_caravan | Coert's Caravan | PLACE | yes | no | free | turn_start, Coert Mosje only, +15 MP | implemented |
| place_delluft | Delluft | PLACE | no | no | free | turn_end, all draw 1 card; SUBSTANCE cost 0 (UI flag) | advanced |
| place_dierenasiel | Dierenasiel | PLACE | no | no | free | 25% MP loss reduction now wired in loseMP (plan 08-04); PET cost-waiver at 0 MP still enforced in UI only | partial |
| place_drain_zone | Drain Zone | PLACE | no | no | free | turn_end, lowest MP Mosje loses -10 MP | advanced |
| place_momentum_factory | Momentum Factory | PLACE | no | no | free | piecie_activated, +10 MP (first-only enforced in UI) | advanced |
| place_momentum_stabilizer | Momentum Stabilizer | PLACE | no | no | free | passive flag only; 30 MP loss cap enforced in UI | advanced |
| place_obby_1 | Obby #1 | PLACE | yes | no | free | quest_completed/failed, Physical 2+ or Resilient 2+, +20/-10 MP | implemented |
| place_quest_haven | Quest Haven | PLACE | yes | no | free | quest_completed, +10 MP; 2-quest bonus +25 MP (UI tracked) | implemented |
| place_skiffa | Skiffa | PLACE | no | no | free | turn_end, -15 MP unless SUBSTANCE trait 1+ | advanced |
| place_synergy_chamber | Synergy Chamber | PLACE | no | no | free | getSynergyChambercostReduction/DurationBonus/DiceBonus exported+JSDoc'd; dice bonus already consumed in questLogic; cost/duration reduction deferred to ability activation caller | partial |
| place_the_gym | The Gym | PLACE | yes | no | free | turn_end, Physical 3→+35, Physical 2→+25, else -10 MP | implemented |
| place_the_void | The Void | PLACE | no | no | free | turn_end, all -15 MP; RESTORE/FOOD restriction via void_active flag | advanced |
| place_welloe_graveyard | Welloe Graveyard | PLACE | no | no | free | mosje_defeated, +20 MP + draw 1 card for that player | advanced |
| place_zo_is_natuur | Zo is Natuur | PLACE | yes | no | free | turn_end, Resilient 1+→+15 MP, else +10 MP | implemented |

### Place Design Notes
- **Digital Gaming Stop**: hidden (booster-only flag set); no engine implementation.
- **Dierenasiel**: TS stub registered with `dierenasiel_active` flag; PET cost/protection effects enforced in browser only. For Cless teacher / AZN Cless.
- **Quest Haven**: 2-quest-per-turn bonus (+25 MP) tracked in browser only via `questsCompletedThisTurn` counter; TS engine fires +10 MP per quest_completed event.
- **Momentum Factory**: TS engine fires +10 MP per piecie_activated event; browser enforces "first Piecie only" restriction via `pieciesPlayedThisTurn` counter.

## Quest (44)

| ID | Name | Group | Starter | Booster | Cost | Summary | Status |
|---|---|---|---|---|---|---|---|
| quest_arm_wrestling | Arm Wrestling | general | no | no | free | Quest success effects: gainMP | advanced |
| quest_artistic_expression | Artistic Expression | general | yes | no | free | auto-succeed Creative ★★+; draw 2 DEFERRED (UI hook) | implemented |
| quest_build_gadget | Build Gadget | general | no | no | free | Quest success effects: gainMP | implemented |
| quest_calculate_odds | Calculate Odds | general | no | no | free | Quest success effects: gainMP | implemented |
| quest_chain_master | Chain Master | general | no | no | free | roll 3+ with 3+ Piecies in discard; this-turn tracking DEFERRED | implemented |
| quest_create_masterpiece | Create Masterpiece | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_debug_system | Debug System | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_elimination_challenge | Elimination Challenge | general | no | no | free | roll 4+; opponent -30 MP side effect DEFERRED (UI hook) | implemented |
| quest_endurance_test | Endurance Test | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_endure_pain | Endure Pain | general | no | no | free | Quest success effects: gainMP | implemented |
| quest_form_alliance | Form Alliance | general | no | no | free | Quest success effects: drainMP+gainMP | implemented |
| quest_geen_raad_vraag_aad | Geen Raad? Vraag Aad! | general | no | no | free | SIMPLIFIED: roll 4+ (card-guess UI DEFERRED) | implemented |
| quest_hack_mainframe | Hack Mainframe | general | yes | no | free | Quest success effects: gainMP; Hacker bonus DEFERRED (mosjeId vs cardId) | implemented |
| quest_improvise | Improvise! | general | yes | no | free | Quest success effects: gainMP | implemented |
| quest_inspire_crowd | Inspire Crowd | general | no | no | free | Quest success effects: gainMP | advanced |
| quest_larry_temmen | Larry Temmen Niemand Zeggen | general | no | no | free | SIMPLIFIED: roll 5+ = success (3-way outcome DEFERRED) | implemented |
| quest_late_night_questing | Late Night Questing | general | no | no | free | roll 3+; draw 2 on success DEFERRED (UI hook) | implemented |
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

## Deferred Features and Simplifications

### Phase 4 Questions
- zie-je-die-dingetjes: ✅ resolved in Phase 8 (plan 08-03) — full two-call peek+keep pattern implemented.
- call-of-the-welloes: summon semantics stubbed — linked-Mosje attachment primitive still needed.
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
- place_synergy_chamber keeps forced-synergy support; duration extension and ability-cost reduction remain deferred.

### Phase 8 Questions
- Plans 08-01 through 08-04 resolved most partial cards (see ✅ notes above and in Phase 5 section).
- Remaining partial/advanced cards: mosje_fps_west (UI peek reveal), ronald-the-master-chef (UI hand reveal), place_synergy_chamber (cost/duration reduction callers deferred), place_dierenasiel (PET cost-waiver deferred), call-of-the-welloes (linked-Mosje attachment), dingetje-toch (requirement bypass UI), double-trigger (double-fire executor), snelle_frenssen (UI targetRef), snelle_jammertje_gepakt (send-to-bottom primitive), snelle_jensen (source-card discard), snelle_jeweetniet (force-reroll interception UI).
- Quest section: see plan 08-06 for full quest audit and classification.

### Phase 10 Notes
- emergency-swap is explicitly marked as advanced for experienced players.
- Post-balance simulation reduced never-played cards from 36 to 21 but did not eliminate all advanced/deferred mechanics.
