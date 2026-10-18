// comboTags.js — Strategic role tags for cards the bot plays/activates.
// Pure data + one accessor. Tags drive activation ORDER, hold-back decisions (planPiecieActivations.js), "does it do
// anything right now" (isUsefulActivation.js) and the own-Mosje pick (pickBotOwnTarget.js) — they never change game rules.
// Every key is a Piecie id of src/data/piecies.js (a test checks it); tagged from the 2.0 Card List texts.
//
// Roles:
//   'multiplier'    — arms a buff that boosts LATER actions this turn
//                     (activate before mp-gain and abilities).
//   'mp-gain'       — direct MP boosters (activate before the quest attempt).
//   'quest-prep'    — +1 die / reroll: only pays off if a Quest is attempted THIS turn.
//   'power'         — a Power boost for one of our Mosjes: only pays off if a Mosje can still attack.
//   'attack'        — direct opponent loss or disruption (early when the profile is aggressive).
//   'place-destroy' — destroys (or takes back) the Place: only worth it for a Place the opponent played.
//   'self-loss'     — one of our Mosjes loses MP (the card pays it back with cards).
//   'payoff'        — scales with actions already taken this turn (activate last).
//   'draw'          — card advantage.
//   'defense'       — pets / shields / damage reduction.
//   'utility'       — everything else (default when a card has no entry).

export const COMBO_TAGS = {
	// Multipliers / enablers — fire BEFORE the gains they amplify
	piecie_mp_amplifier: ['multiplier'],
	piecie_dubbele_ding: ['multiplier'],
	piecie_double_trigger: ['multiplier'],
	piecie_redbull: ['multiplier'],
	piecie_synergy_field: ['multiplier'],

	// Direct MP boosters
	piecie_kannetje_melk: ['mp-gain'],
	piecie_broodje_doner: ['mp-gain'],
	piecie_chefs_special: ['mp-gain'],
	piecie_energy_surge: ['mp-gain'], // Shoettoe
	piecie_ronald_kip: ['mp-gain'],
	piecie_momentum_boost: ['mp-gain'],
	piecie_eendjes_voeren: ['mp-gain'], // Nature's Gift
	piecie_varkenspootjes: ['mp-gain'],
	piecie_grammetje_pieter: ['mp-gain'],
	piecie_protein_shake: ['mp-gain'],
	piecie_dumbbells: ['mp-gain'],
	piecie_keyboard: ['mp-gain', 'draw'],
	piecie_mouse: ['mp-gain'],
	piecie_dikke_jonko: ['mp-gain', 'draw'],
	piecie_f1_telemetry: ['mp-gain', 'draw'],
	piecie_tikker: ['mp-gain'],

	// Quest preparation — wasted unless a Quest follows this turn (the ones that also gain MP or draw are not held back)
	piecie_quest_prep: ['quest-prep'], // Dubbele Dosis
	piecie_loaded_dice: ['quest-prep'],
	piecie_dikke_plaat: ['quest-prep'],
	piecie_controller: ['quest-prep', 'mp-gain'],
	piecie_skipping_rope: ['quest-prep', 'draw'],
	piecie_tweede_kans: ['quest-prep'],
	piecie_battle_concert: ['quest-prep'],

	// Power boosts — only worth it when a Mosje can still attack
	piecie_snoeiertje: ['power'],
	piecie_te_hard_gaan: ['power'],
	piecie_super_saiyan_mos: ['power'],
	piecie_momentum_diefje: ['power'],
	piecie_continuous_assault: ['power'],
	piecie_mp_hemorrhage: ['power'],
	piecie_dikke_taks: ['power'],
	piecie_boxing_gloves: ['power'],

	// Direct opponent loss / disruption
	piecie_affoe: ['attack'],
	piecie_kleine_taks: ['attack'],
	piecie_straffoe: ['attack'],
	piecie_harde_didde: ['attack'],
	piecie_klaar_met_jou: ['attack'],
	piecie_stookerino: ['attack'],
	piecie_jantje_jantje: ['attack'],
	piecie_those_eyelashes: ['attack'],

	// Place destroyers
	piecie_slecht_gezet: ['place-destroy'],
	piecie_popo_komt: ['place-destroy'],
	piecie_huisbaas: ['place-destroy'],
	piecie_bong_hit_demolition: ['place-destroy', 'draw'],

	// Card advantage
	piecie_pot_of_weed: ['draw'],
	piecie_bagga_of_greed: ['draw'],
	piecie_warm_kannetje_melk: ['self-loss', 'draw'],
	piecie_stripje_bennies: ['self-loss', 'draw'],

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
