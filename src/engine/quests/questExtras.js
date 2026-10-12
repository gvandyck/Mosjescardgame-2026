// QUEST_EXTRAS — per-Quest "Also:" rules. extraDice(ctx, dieChoices) -> number of +1 dice.
// ctx = { state, playerId, player, slot, slotIndex, quest, revealed } where state/player are the attempt's CLONE,
// so paid choices (Energy, discards) may mutate ctx.player. 56-04 adds onWin / onFail / jab to this table.
import { PIECIES } from '../../data/piecies.js';
import { toGraveyardEntry } from '../graveyardUtils.js';
import { isNamedMosje } from './isNamedMosje.js';
import { drawFromEffect } from '../turn/drawFromEffect.js';
import { reorderDeckTop } from './reorderDeckTop.js';
import { removeDiscardsFromGame } from './removeDiscardsFromGame.js';
import { gainMP } from '../mpManager.js';

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
		jab: true,
		extraDice: ({ player, slotIndex }) =>
			player.activeSlots.some((s, i) => i !== slotIndex && s && s.attackedThisTurn) ? 1 : 0,
	},
	quest_survive_storm: { extraDice: ({ slot }) => (slot.mp <= 30 ? 1 : 0) },
	quest_calculate_odds: { extraDice: ({ revealed }) => sharedType(revealed) },
	quest_late_night_questing: {
		jab: 'nonDigital', extraDice: ({ player }) => gearInGraveyard(player) },
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
	quest_dutch_courage: { jab: true },
	quest_regelaar: { jab: true },
	quest_shotje_obby: { jab: 'mostMp' },
	quest_larry_temmen: { jab: 'larryOnly' },
	quest_geen_raad_vraag_aad: {
		winBonus: ({ slot }) => (isNamedMosje(slot, 'Gandoe') ? 10 : 0),
		// Vraag Aad: discarding 1 hand card on a fail reduces the loss to 10.
		failBase(s, { playerId }, choices) {
			const i = choices.vraagAadDiscardHandIndex;
			const player = s.players[playerId];
			if (!Number.isInteger(i) || !player.hand[i]) return { s, base: null };
			const [card] = player.hand.splice(i, 1);
			player.graveyard.push(toGraveyardEntry(card.cardId, 'discarded'));
			return { s, base: 10 };
		},
	},
	quest_speed_run: { winBonus: ({ slot }) => (isNamedMosje(slot, 'Youri') ? 10 : 0) },
	quest_parkeren_delft: {
		winBonus: ({ slot }) => (isNamedMosje(slot, 'Coert') ? 10 : 0),
		failBonus: ({ slot }) => (isNamedMosje(slot, 'Cless') ? 10 : 0),
		onWin: (s, _ctx, choices) => removeDiscardsFromGame(s, choices.parkerenRemove, 3),
	},
	quest_cheat_code: { onWin: (s, { playerId }) => drawFromEffect(s, playerId, 1) },
	quest_debug_system: {
		onWin(s, _ctx, choices) {
			const d = choices.debugSystem;
			return d ? reorderDeckTop(s, d.deckOwnerId, d.order, 5) : s;
		},
	},
	quest_form_alliance: {
		onWin(s, { playerId }, choices) {
			const t = choices.formAllianceTarget;
			const slot = s.players[t?.playerId]?.activeSlots?.[t?.slotIndex];
			if (!t || t.playerId === playerId || !slot || slot.isDefeated || slot.entryProtected) return s;
			return gainMP(s, t.playerId, t.slotIndex, 10, 'QUEST');
		},
	},
};
