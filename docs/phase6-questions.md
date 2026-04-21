# Phase 6 Questions

## Open Items
None at Step 0.

---

## Step 2–5: Quest Implementation Simplifications

The following quests have requirements or resolution logic that could not be fully
implemented with the current engine primitives.

### OR-requirement simplifications
The engine evaluates `requirements` as AND-only. The following quests have OR conditions:

| Quest | Spec OR condition | Simplification |
|---|---|---|
| `quest_endurance_test` | 60 MP **OR** Physical ★★★ | autoSucceedCondition = 60 MP; Physical ★★★ falls back to trait roll |
| `quest_survive_storm` | Resilient ★★ **OR** mp < 30 | autoSucceedCondition = Resilient ★★; low-MP path uses roll |
| `quest_artistic_expression` | Creative ★★ **OR** drawn 2 cards this turn | autoSucceedCondition = Creative ★★; drawn-2-cards not checked |
| `quest_negotiation` | Social ★★★ auto **OR** discard Piecie = roll | autoSucceedCondition = Social ★★★; discard cost not enforced |
| `quest_improvise` | Creative ★★★ auto **OR** pay 15 MP = roll | autoSucceedCondition = Creative ★★★; 15 MP cost not enforced |
| `quest_hack_mainframe` | Technical ★★★ auto **OR** pay 20 MP = roll | autoSucceedCondition = Technical ★★★; 20 MP cost not enforced |
| `quest_elimination_challenge` | Welloe-this-turn **OR** pay 40 MP | Stub flat roll; both paths unimplemented |

### Event-log-this-turn tracking needed
| Quest | Missing check |
|---|---|
| `quest_endure_pain` | Lost 25+ MP this turn |
| `quest_speed_run` | Activated 2+ Piecies this turn |
| `quest_chain_master` | Activated 3+ Piecies this turn |
| `quest_build_gadget` | Activated 1+ Piecie this turn |
| `quest_the_gauntlet` | 3 distinct action types this turn |
| `quest_sustained_assault` | Dealt 30+ MP damage this turn |
| `quest_synergy_mastery` | Used Mosje ability AND completed 1 Quest this turn |
| `quest_late_night_questing` | Activated keyboard/mouse/controller ever (lifetime) |

### Multi-condition AND (non-trait) needed
| Quest | Missing condition |
|---|---|
| `quest_master_plan` | 3+ face-down Piecies in play |
| `quest_create_masterpiece` | 3+ Piecies in play |
| `quest_never_give_up` | Exactly Level 1 (`checkLevel` only supports `>=`) |
| `quest_ultimate_challenge` | Any trait at ★★★ (multi-trait OR) |

### Interactive/special resolution needed
| Quest | Special mechanic |
|---|---|
| `quest_calculate_odds` | Reveal top 3 cards, check 2+ same category |
| `quest_regelaar` | Compare Piecie counts across players, conditional discard |
| `quest_larry_temmen` | Opponent guesses location — interactive choice |
| `quest_geen_raad_vraag_aad` | All-player conditional discard-for-MP offer |
| `quest_parkeren_delft` | Tag checks ([COERT]/[CLESS]), banish, place synergy |
| `quest_shotje_obby` | All-player MP comparison with rank-based outcome |

### Opponent-targeting in QuestInvocation
`QuestInvocation.targetRef` added. UI must supply it for:
| Quest | Target |
|---|---|
| `quest_form_alliance` | opponent active mosje (receives 10 MP drain) |

### Debug System
`quest_debug_system`: spec says "look at top 5 cards". No quest-reveal primitive exists.
Simplified to auto-succeed on Technical ★★ with no reveal effect.
