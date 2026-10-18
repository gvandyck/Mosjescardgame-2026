// planPiecieActivations.js — The bot's READY Piecie activations: only the ones that pass the engine gate (Jeffrey,
// Level 2+, "Only if / Needs") and do something right now (isUsefulActivation), ordered by strategic role instead of
// slot position and cut off at the Energy budget:
//   multipliers → MP gains → quest-prep → attacks / Power boosts → draw / Place destroyers → defense → payoffs.
// Also decides hold-backs: quest-prep is skipped when no quest will follow (questPrepBonus resets at end of turn),
// and high-patience profiles hold 'payoff' cards until enough setup is ready this turn.

import { isPiecieReady } from '../../engine/table/isPiecieReady.js';
import { piecieActivationGate } from '../../engine/table/piecieActivationGate.js';
import { PIECIES } from '../../data/piecies.js';
import { getCardTags } from './comboTags.js';
import { asBotView } from './asBotView.js';
import { getBotPaymentCost } from './getBotPaymentCost.js';
import { isUsefulActivation } from './isUsefulActivation.js';

const PIECIE_BY_ID = Object.fromEntries(PIECIES.map(p => [p.id, p]));

const BASE_PRIORITY = {
	multiplier: 0,
	'mp-gain': 1,
	'quest-prep': 2,
	attack: 3,
	power: 3,
	draw: 4,
	'place-destroy': 4,
	defense: 5,
	utility: 5,
	payoff: 6,
};

/**
 * planPiecieActivations
 * @param {object} gameState
 * @param {string} playerId
 * @param {object} profile — from getBotProfile()
 * @param {object} intent — { willQuest: boolean, lethalPressure: boolean, budget?: number (default: the player's Energy) }
 * @returns {Array<{ slotIndex, cardId, tags }>} ordered activation plan
 */
export function planPiecieActivations(gameState, playerId, profile, intent = {}) {
	gameState = asBotView(gameState, playerId); // BOT-04: from here on `gameState` is the table view
	const player = gameState?.players?.[playerId];
	const slots = player?.piecieSlots || [];
	const turnNumber = gameState?.turnNumber ?? 0;

	const ready = [];
	for (let i = 0; i < slots.length; i++) {
		const slot = slots[i];
		if (!isPiecieReady(slot, turnNumber)) continue;
		const def = PIECIE_BY_ID[slot.cardId];
		// The engine's own gate and "does it do anything now" - an illegal or useless Piecie is never planned.
		if (!def || piecieActivationGate(gameState, playerId, def) || !isUsefulActivation(gameState, playerId, slot.cardId)) continue;
		ready.push({ slotIndex: i, cardId: slot.cardId, tags: getCardTags(slot.cardId) });
	}

	const attackEarly = profile?.preferAttack || intent.lethalPressure;
	const planned = [];
	for (const entry of ready) {
		// Quest-prep with no quest coming = wasted (bonus dies at end of turn). One that also gains MP or draws is not.
		const pureQuestPrep = entry.tags.includes('quest-prep') && !entry.tags.includes('mp-gain') && !entry.tags.includes('draw');
		if (pureQuestPrep && !intent.willQuest) continue;
		// Patient decks hold payoff cards until at least 2 other activations
		// are ready to feed them this turn.
		if (
			entry.tags.includes('payoff')
			&& (profile?.comboPatience ?? 0) >= 0.6
			&& ready.length - 1 < 2
		) continue;

		const best = Math.min(...entry.tags.map(tag => {
			if ((tag === 'attack' || tag === 'power') && attackEarly) return 1.5;
			return BASE_PRIORITY[tag] ?? 5;
		}));
		planned.push({ ...entry, priority: best });
	}

	planned.sort((a, b) => a.priority - b.priority || a.slotIndex - b.slotIndex);

	// Energy: walk the plan in order with a running budget. Conservative (the Delluft fee may be counted twice); the
	// driver re-checks canBotAfford exactly before each call.
	let budget = Number.isFinite(intent.budget) ? intent.budget : (Number(player?.energy) || 0);
	const affordable = [];
	for (const entry of planned) {
		const cost = getBotPaymentCost(gameState, playerId, entry.cardId, 'piecie');
		if (cost > budget) continue;
		budget -= cost;
		affordable.push(entry);
	}
	return affordable.map(({ slotIndex, cardId, tags }) => ({ slotIndex, cardId, tags }));
}
