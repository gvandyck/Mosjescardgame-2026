// comboTags.js — Strategic role tags for cards the bot plays/activates.
// Pure data + one accessor. Tags drive activation ORDER and hold-back
// decisions in planPiecieActivations.js — they never change game rules.
//
// Roles:
//   'multiplier' — arms a buff that boosts LATER actions this turn
//                  (activate before mp-gain and abilities).
//   'mp-gain'    — direct MP boosters (activate before the quest attempt).
//   'quest-prep' — only pays off if a quest is attempted THIS turn
//                  (questPrepBonus resets at end of turn).
//   'attack'     — pressures the opponent (early when profile is aggressive).
//   'payoff'     — scales with actions already taken this turn (activate last).
//   'draw'       — card advantage.
//   'defense'    — pets / shields / damage reduction.
//   'utility'    — everything else (default when a card has no entry).

export const COMBO_TAGS = {
	// Multipliers / enablers — fire BEFORE the gains they amplify
	piecie_mp_amplifier: ['multiplier'],
	piecie_dubbele_ding: ['multiplier'],
	piecie_dubbele_dosis: ['multiplier'],
	piecie_double_trigger: ['multiplier'],
	piecie_redbull: ['multiplier'],
	piecie_synergy_field: ['multiplier'],

	// Direct MP boosters
	piecie_kannetje_melk: ['mp-gain'],
	piecie_broodje_doner: ['mp-gain'],
	piecie_shoettoe: ['mp-gain'],
	piecie_ronald_kip: ['mp-gain'],
	piecie_momentum_boost: ['mp-gain'],
	piecie_eendjes_voeren: ['mp-gain'],
	piecie_varkenspootjes: ['mp-gain'],
	piecie_grammetje_pieter: ['mp-gain'],
	piecie_protein_shake: ['mp-gain'],
	piecie_boxing_gloves: ['mp-gain'],
	piecie_dumbbells: ['mp-gain'],
	piecie_keyboard: ['mp-gain', 'draw'],
	piecie_mouse: ['mp-gain'],
	piecie_controller: ['mp-gain'],
	piecie_dikke_jonko: ['mp-gain', 'draw'],
	piecie_tikker: ['mp-gain', 'attack'],

	// Quest preparation — wasted unless a quest follows this turn
	piecie_quest_prep: ['quest-prep'],
	piecie_skipping_rope: ['quest-prep', 'draw'],
	piecie_battle_concert: ['quest-prep'],
	piecie_f1_telemetry: ['quest-prep'],

	// Attack / opponent pressure
	piecie_te_hard_gaan: ['attack'],
	piecie_affoe: ['attack'],
	piecie_momentum_diefje: ['attack'],
	piecie_dikke_taks: ['attack'],
	piecie_kleine_taks: ['attack'],
	piecie_snoeiertje: ['attack'],
	piecie_stookerino: ['attack'],
	piecie_jantje_jantje: ['attack'],
	piecie_those_eyelashes: ['attack'],
	piecie_straffoe: ['attack'],
	piecie_mp_hemorrhage: ['attack'],
	piecie_harde_didde: ['attack'],
	piecie_klaar_met_jou: ['attack'],

	// Card advantage
	piecie_pot_of_weed: ['draw'],
	piecie_bagga_of_greed: ['draw'],
	piecie_warm_kannetje_melk: ['draw'],
	piecie_stripje_bennies: ['draw'],

	// Defense / pets
	piecie_bowie_stormey: ['defense'],
	piecie_gekke_vogels: ['defense'],
	piecie_katjegang: ['defense'],
	piecie_vianna_poes: ['defense'],
	piecie_tony: ['defense'],
	piecie_laat_me_chillen: ['defense'],
	piecie_mosje_shield: ['defense'],
	piecie_afblijven: ['defense'],

	// Payoffs that scale with prior actions this turn — activate last
	piecie_chain_reaction: ['payoff'],
};

// Returns the tag list for a card id; unknown cards default to ['utility'].
export function getCardTags(cardId) {
	return COMBO_TAGS[cardId] || ['utility'];
}
