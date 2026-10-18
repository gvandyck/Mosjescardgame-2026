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
	// 2.0 Example Decks, from their "Playing it" notes.
	// Taksen: Gym and Boxing Gloves pressure; hit first, take the Quest odds.
	EXAMPLE_TAKSEN: {
		archetype: 'aggressive',
		riskTolerance: 0.6,
		comboPatience: 0.2,
		preferAttack: true,
	},
	// Regelaars: fill the slots for Chris's Perfect Setup and the Master Plan Quest, keep Jammertje live.
	EXAMPLE_REGELAARS: {
		archetype: 'setup-control',
		riskTolerance: 0.45,
		comboPatience: 0.6,
		preferAttack: false,
	},
	// Creatievelingen: Tuk heals every turn, chains off Jisca; steady tempo.
	EXAMPLE_CREATIEVELINGEN: {
		archetype: 'tempo-sustain',
		riskTolerance: 0.5,
		comboPatience: 0.4,
		preferAttack: false,
	},
	// V4 duo decks (kept; not used by the 2.0 Example Decks).
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
