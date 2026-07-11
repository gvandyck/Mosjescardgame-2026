// planPiecieActivations.js — Orders the bot's READY Piecie activations by
// strategic role instead of slot position:
//   multipliers → MP gains → quest-prep → attacks → draw/defense → payoffs.
// Also decides hold-backs: quest-prep is skipped when no quest will follow
// (questPrepBonus resets at end of turn), and high-patience profiles hold
// 'payoff' cards until enough setup is ready this turn.

import { getCardTags } from './comboTags.js';

const BASE_PRIORITY = {
	multiplier: 0,
	'mp-gain': 1,
	'quest-prep': 2,
	attack: 3,
	draw: 4,
	defense: 5,
	utility: 5,
	payoff: 6,
};

/**
 * planPiecieActivations
 * @param {object} gameState
 * @param {string} playerId
 * @param {object} profile — from getBotProfile()
 * @param {object} intent — { willQuest: boolean, lethalPressure: boolean }
 * @returns {Array<{ slotIndex, cardId, tags }>} ordered activation plan
 */
export function planPiecieActivations(gameState, playerId, profile, intent = {}) {
	const player = gameState?.players?.[playerId];
	const slots = player?.piecieSlots || [];
	const turnNumber = gameState?.turnNumber ?? 0;

	const ready = [];
	for (let i = 0; i < slots.length; i++) {
		const slot = slots[i];
		if (!slot || slot.type !== 'PIECIE' || slot.activated) continue;
		if (turnNumber < (slot.canActivateOnTurn ?? Infinity)) continue;
		ready.push({ slotIndex: i, cardId: slot.cardId, tags: getCardTags(slot.cardId) });
	}

	const attackEarly = profile?.preferAttack || intent.lethalPressure;
	const planned = [];
	for (const entry of ready) {
		// Quest-prep with no quest coming = wasted (bonus dies at end of turn).
		if (entry.tags.includes('quest-prep') && !intent.willQuest) continue;
		// U8 — attacks fizzle while every opponent Mosje is entry-protected;
		// hold them a turn instead of wasting the activation.
		if (entry.tags.includes('attack') && intent.opponentFullyProtected) continue;
		// Patient decks hold payoff cards until at least 2 other activations
		// are ready to feed them this turn.
		if (
			entry.tags.includes('payoff')
			&& (profile?.comboPatience ?? 0) >= 0.6
			&& ready.length - 1 < 2
		) continue;

		const best = Math.min(...entry.tags.map(tag => {
			if (tag === 'attack' && attackEarly) return 1.5;
			return BASE_PRIORITY[tag] ?? 5;
		}));
		planned.push({ ...entry, priority: best });
	}

	planned.sort((a, b) => a.priority - b.priority || a.slotIndex - b.slotIndex);
	return planned.map(({ slotIndex, cardId, tags }) => ({ slotIndex, cardId, tags }));
}
