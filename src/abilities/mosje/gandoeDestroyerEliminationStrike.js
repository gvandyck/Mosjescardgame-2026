// Gandoe, The Destroyer — Elimination Strike: once per game, pay 4 Energy (useMosjeAbility charges Energy and
// the once-per-game flag): the opponent's lowest-level Mosje goes to the Welloe pile (owner picks on a tie).
// Fresh Mosjes can't be picked. Refused (throws, nothing spent) when no opponent Mosje is a legal target.
import { runTriggerJobs } from '../../engine/mosje/runTriggerJobs.js';
import { getStrikeCandidates } from './getStrikeCandidates.js';

export function gandoeDestroyerEliminationStrike(gameState, playerId, mosjeId = 'mosje_gandoe_destroyer') {
	const state = JSON.parse(JSON.stringify(gameState));
	const slotIndex = state.players[playerId]?.activeSlots?.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId);
	if (slotIndex === undefined || slotIndex < 0) throw new Error('Gandoe, The Destroyer is not on the field');
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	if (getStrikeCandidates(state, oppId).length === 0) {
		throw new Error('No opponent Mosje to strike — fresh Mosjes are protected until their next turn');
	}
	return runTriggerJobs(state, 'destroyerStrike', [{ triggerIdx: 0, playerId, slotIndex }], 0, { playerId });
}
