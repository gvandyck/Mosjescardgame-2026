// botProfiles.js — Per-deck bot personalities (data) + one accessor.
// A profile never changes what is LEGAL — only how the bot weighs choices.
//
// Fields:
//   archetype     — label for logs/metrics only.
//   riskTolerance — 0..1. Higher = accepts lower quest success odds
//                   (0.5 is neutral; shifts the required-p in assessQuestRisk).
//   comboPatience — 0..1. Higher = holds 'payoff' cards until more setup
//                   is ready instead of activating them immediately.
//   preferAttack  — ranks 'attack' activations ahead of draw/defense.

export const DEFAULT_BOT_PROFILE = {
	archetype: 'balanced',
	riskTolerance: 0.5,
	comboPatience: 0.35,
	preferAttack: false,
};

export const BOT_PROFILES = {
	// Boxing pressure: quest hard, punch harder.
	DUO_GANDOE_MICHELLE: {
		archetype: 'aggressive',
		riskTolerance: 0.65,
		comboPatience: 0.2,
		preferAttack: true,
	},
	// FOOD engine: steady value, no reckless quests.
	DUO_COERT_BINTI: {
		archetype: 'combo-control',
		riskTolerance: 0.5,
		comboPatience: 0.5,
		preferAttack: false,
	},
	// Instant-setup chains: patient, only quests on good odds.
	DUO_CHRIS_YOURI: {
		archetype: 'setup-combo',
		riskTolerance: 0.45,
		comboPatience: 0.7,
		preferAttack: false,
	},
	// Tempo + sustain: keeps pressure while pets soak damage.
	DUO_JISCA_ALYSSA: {
		archetype: 'tempo-sustain',
		riskTolerance: 0.55,
		comboPatience: 0.35,
		preferAttack: true,
	},
	// Calculated risk: plays the odds, not the gut.
	DUO_WEST_CLESS: {
		archetype: 'calculated-risk',
		riskTolerance: 0.5,
		comboPatience: 0.4,
		preferAttack: false,
	},
};

// Resolves the profile for a player from state.players[pid].deckId.
// Unknown/legacy decks get DEFAULT_BOT_PROFILE. Always returns a copy
// carrying deckId so metrics can attribute decisions to a deck.
export function getBotProfile(gameState, playerId) {
	const deckId = gameState?.players?.[playerId]?.deckId || null;
	const profile = (deckId && BOT_PROFILES[deckId]) || DEFAULT_BOT_PROFILE;
	return { deckId, ...profile };
}
