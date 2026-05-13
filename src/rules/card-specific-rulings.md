# Card-Specific Rulings (Phase 0)

This file maps the authoritative Phase 0 rulings to concrete card IDs.

## Cross-cutting cards resolved by universal rules

- U1 single-target timing and lock: piecie_super_saiyan_mos, piecie_te_hard_gaan, piecie_momentum_diefje, piecie_kleine_taks, piecie_affoe, piecie_continuous_assault, piecie_snoeiertje
- U2 any deck scope/visibility: mosje_martin_historian, mosje_hacker, piecie_mouse
- U3 random hand selection: mosje_binti
- U4 while-on-field passive duration: mosje_jeffrey, mosje_coert_kastelein
- U5 turn-duration expiration: piecie_synergy_field, piecie_mosje_shield, piecie_bowie_stormey, piecie_gekke_vogels, piecie_katjegang, piecie_vianna_poes, piecie_continuous_assault, piecie_kleine_taks, piecie_tikker, piecie_afblijven
- U6 MP modifier order: piecie_ronald_kip and all chained MP modifications
- U7 cost payment distinction: place_the_void, mosje_coert_kastelein, snelle_drain_reversal

## Card-by-card rulings

- mosje_jeffrey: Quest bonus applies only to Jeffrey quest completions (general/personal/mixed); restore restriction blocks Jeffrey as target for primary gain_mp piecies.
- mosje_ronald_chef: chosen hand card gets blocked_until_turn_N for opponent next turn; failed activation keeps card in hand.
- mosje_hacker: 5-turn cooldown counted on owner turns; starts at end of use turn and is available on owner turn 6.
- mosje_fps_coert: target is selected only after success roll 6.
- mosje_ronald_mastermind: piecie activated from discard returns to discard after resolution.
- mosje_binti: random discard uses uniform RNG, not target player choice.
- mosje_coert_kastelein: apply -20 reduction first, then 50+ cap-to-25 rule; castle token is separate and not reduced by Kast-elein itself.
- piecie_ronald_kip: apply Ronald bump then Coert+Binti doubling, then later external amplifiers per U6.
- piecie_tempiecie: retrieved card is locked in hand until start of next owner turn.
- piecie_mosje_shield: welloe prevention lasts 2 owner turns and cancels elimination effects.
- piecie_perfect_setup: creates quest-only MP override 60-90 chosen by player; real MP unchanged.
- piecie_tikker: quest lock applies to the Mosje entity on its next turn, not slot.
- snelle_jammertje_gepakt: negates targeted piecie and sends it to bottom of owner's deck; mental 3 bonus draw 1.
- snelle_gevalletje_klakkeloos: copies final MP gain amount only, one trigger instance per event.
- place_skiffa: discard-or-lose choice belongs to Mosje owner; digital activation penalty applies immediately on piecie activation.
- place_the_void: blocks effect-based gain/loss only; quest success/failure still occurs with zero reward/penalty.
- piecie_emergency_swap: copied ability is one-time base-form use; copied ability costs still paid; no transfer of synergy/pet bonuses.
- place_synergy_chamber: forces declared synergies active globally; chamber bonuses remain separate from synergy values.
- place_momentum_stabilizer: blocks set_mp / exact adjust primitives; does not block normal gain_mp/lose_mp.
- piecie_call_of_welloes: Call of the Haunted-style linked revive. Choose a Mosje in a Welloe pile and summon it to the field at level 1, 0 MP. Call of the Welloes stays linked to that Mosje; if the Piecie leaves play, the summoned Mosje returns to Welloe. If the summoned Mosje leaves the field first, Call of the Welloes is discarded/cleared.
- piecie_harde_didde: threshold checked at activation, then opponent gets snelle response window.
- piecie_klaar_met_jou: threshold checked at activation, then opponent gets snelle response window.
- snelle_drain_reversal: reverses next single incoming effect-based loss only; one tick in multi-tick chains.
- snelle_frenssen and snelle_blensen: max chain depth 3 with stack priority windows.
