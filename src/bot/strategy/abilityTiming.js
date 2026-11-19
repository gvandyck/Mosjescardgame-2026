// abilityTiming.js — WHEN in the bot's turn each Mosje ability is worth using.
// Pure data + one accessor. Game knowledge, not deck preference (profiles
// decide IF an ability is used; this decides WHEN).
//
// Phases:
//   'early'    — before playing/activating Piecies (arms per-Piecie triggers
//                or grants extra plays this turn).
//   'preQuest' — after Piecie activations, before the quest attempt
//                (setup abilities that convert board state into MP/tempo).
//   'late'     — after the quest attempt (default; attack/value abilities).
//   'skip'     — never trigger manually (auto-abilities fire on their own).

export const ABILITY_TIMING = {
	// 2.1 starter Mosjes
	mosje_gandoe_wizard: 'early',     // top-3 pick: dig for cards before playing
	mosje_ming_natural: 'early',      // reveal + draw the top card; a Piecie may be activated at once
	mosje_youri: 'preQuest',          // pay 1 Energy, activate a Piecie placed this turn
	mosje_binti: 'late',              // discard a Piecie from the hand, hit a Mosje
	mosje_fps_west: 'late',           // look at the hand, may bottom a card
	mosje_ronald_mastermind: 'late',  // Dr. Phill-osoof: mark an opponent Mosje
	mosje_jeffrey_gambler: 'late',    // High Stakes: stake Energy on a die
	mosje_michelle: 'skip',           // passive: Iron Tuk cuts an attack
	mosje_ronald_chef: 'skip',        // passive: first food Piecie +10 MP
	mosje_jeffrey: 'skip',            // passive: 3 attachments
	mosje_alyssa_bulldozer: 'skip',   // passive: scales with damage
	mosje_chris_ddr: 'skip',          // trigger: free Piecie on a Piecie activation
	mosje_fps_coert: 'skip',          // trigger: Headshot on a Quest win
	mosje_dj_8020: 'skip',            // reaction window: Lucky Beats reroll
	mosje_coert_tech: 'skip',         // draw-step option
	// older (non-starter) Mosjes
	mosje_coert_kasteluck: 'early',
	mosje_jisca: 'early',
	mosje_gandoe_destroyer: 'late',
	mosje_azn_cless: 'late',
	mosje_martin_senor_west: 'late',
};

// Returns the turn phase in which the bot should consider this Mosje's
// ability. Mosjes flagged autoAbility in data should be passed through the
// caller's own skip check; unknown Mosjes default to 'late' (old behavior).
export function getAbilityTiming(mosjeCardId) {
	return ABILITY_TIMING[mosjeCardId] || 'late';
}
