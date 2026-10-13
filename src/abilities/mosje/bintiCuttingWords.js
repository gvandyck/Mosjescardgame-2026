// Binti, The Sharp Tongue — Cutting Words: once per turn, pay 1 Energy (useMosjeAbility) and discard 1 Piecie from
// hand: one opponent Mosje of the owner's choice (not fresh) loses 10 MP and the opponent discards 1 card of their
// own choice. Inputs (state._pendingTargets): hand_card (hand index or Piecie cardId), opp_slot_index (default: first
// non-fresh Mosje). Refused (throws, nothing spent) for a non-Piecie card or when every opponent Mosje is fresh.
import { loseMP } from '../../engine/mpManager.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { PIECIES } from '../../data/piecies.js';
import { runTriggerJobs } from '../../engine/mosje/runTriggerJobs.js';

export function bintiCuttingWords(gameState, playerId, mosjeId = 'mosje_binti') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');
	const bintiIndex = player.activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId);
	if (bintiIndex < 0) throw new Error('Binti is not on the field');
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const opp = state.players[oppId];
	const targets = state._pendingTargets || {};

	const handPick = targets.hand_card;
	const handIndex = Number.isInteger(handPick) ? handPick : player.hand.findIndex(c => c.cardId === handPick);
	const card = player.hand[handIndex];
	if (!card || !PIECIES.some(p => p.id === card.cardId)) throw new Error('Cutting Words needs a Piecie from your hand');

	const open = (opp?.activeSlots || []).map((s, i) => ({ s, i })).filter(({ s }) => s && !s.isDefeated && !isFresh(s));
	const chosen = targets.opp_slot_index;
	const target = Number.isInteger(chosen) ? open.find(({ i }) => i === chosen) : open[0];
	if (!target) throw new Error('No opponent Mosje to target — fresh Mosjes are protected until their next turn');
	delete targets.hand_card;
	delete targets.opp_slot_index;

	player.graveyard.push(...player.hand.splice(handIndex, 1));
	const hit = loseMP(state, oppId, target.i, 10, 'ABILITY', false, playerId);
	return runTriggerJobs(hit, 'bintiDiscard', [{ triggerIdx: 0, playerId, slotIndex: bintiIndex }], 0, { playerId, discarderId: oppId });
}
