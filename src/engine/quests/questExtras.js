// QUEST_EXTRAS — per-Quest "Also:" rules. extraDice(ctx, dieChoices) -> number of +1 dice.
// ctx = { state, playerId, player, slot, slotIndex, quest, revealed } where state/player are the attempt's CLONE,
// so paid choices (Energy, discards) may mutate ctx.player. 56-04 adds onWin / onFail / jab to this table.
import { PIECIES } from '../../data/piecies.js';
import { toGraveyardEntry } from '../graveyardUtils.js';

const cardType = (id) => toGraveyardEntry(id, 'x').type;

function sharedType(revealed) {
	const counts = {};
	for (const id of revealed || []) counts[cardType(id)] = (counts[cardType(id)] || 0) + 1;
	return Object.values(counts).some(n => n >= 2) ? 1 : 0;
}

function gearInGraveyard(player) {
	const gear = (player.graveyard || []).filter(g => PIECIES.find(p => p.id === (g?.cardId ?? g))?.tag === 'gear');
	return gear.length >= 2 ? 1 : 0;
}

export const QUEST_EXTRAS = {
	quest_sustained_assault: {
		extraDice: ({ player, slotIndex }) =>
			player.activeSlots.some((s, i) => i !== slotIndex && s && s.attackedThisTurn) ? 1 : 0,
	},
	quest_survive_storm: { extraDice: ({ slot }) => (slot.mp <= 30 ? 1 : 0) },
	quest_calculate_odds: { extraDice: ({ revealed }) => sharedType(revealed) },
	quest_late_night_questing: { extraDice: ({ player }) => gearInGraveyard(player) },
	quest_artistic_expression: { extraDice: ({ player }) => ((player.cardsDrawnThisTurn || 0) >= 2 ? 1 : 0) },
	quest_improvise: {
		extraDice({ player }, dieChoices) {
			if (!dieChoices.payEnergy || (player.energy || 0) < 1) return 0;
			player.energy -= 1;
			return 1;
		},
	},
	quest_strategy_puzzle: {
		extraDice({ player }, dieChoices) {
			const i = dieChoices.discardHandIndex;
			if (!Number.isInteger(i) || !player.hand?.[i]) return 0;
			const [card] = player.hand.splice(i, 1);
			player.graveyard.push(toGraveyardEntry(card.cardId, 'discarded'));
			return 1;
		},
	},
};
