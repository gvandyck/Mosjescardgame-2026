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
	mosje_coert_kasteluck: 'early',   // Morning Luck: extra Piecie play this turn
	mosje_jisca: 'early',             // Perfect Combo: arms per-Piecie chain rolls
	mosje_chris: 'preQuest',          // Perfect Setup: free activation + 15 MP
	mosje_youri: 'preQuest',          // Speed Activate: fire a fresh Piecie now
	mosje_michelle: 'skip',           // Tough Gamble is automatic on quest resolve
	mosje_gandoe_destroyer: 'late',   // Elimination Strike (gated separately)
	mosje_binti: 'late',              // Cutting Words: discard fodder chosen by bot
	mosje_azn_cless: 'late',          // Risk and Reward: end-of-turn style roll
	mosje_martin_senor_west: 'late',  // Calculated Guess
	mosje_alyssa_bulldozer: 'late',   // Unstoppable: scales with damage taken
};

// Returns the turn phase in which the bot should consider this Mosje's
// ability. Mosjes flagged autoAbility in data should be passed through the
// caller's own skip check; unknown Mosjes default to 'late' (old behavior).
export function getAbilityTiming(mosjeCardId) {
	return ABILITY_TIMING[mosjeCardId] || 'late';
}
