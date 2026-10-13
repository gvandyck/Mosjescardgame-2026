// Ronald, The Mastermind — Master Plan: once per turn, pay 2 Energy (useMosjeAbility): activate a Piecie from your
// discard pile as if it were ready; this replaces its own Energy cost (a free activation). It goes back to the
// discard pile afterwards (a Stays Piecie takes a free Piecie slot, the existing Stays rule; no slot = refused).
// Input: _pendingTargets.discard_card = an index into the discard pile (or a card id). Refused = throws, nothing paid.
import { activatePiecieFree } from '../../engine/table/activatePiecieFree.js';
import { PIECIES } from '../../data/piecies.js';

const PIECIE_IDS = new Set(PIECIES.map(p => p.id));

export function ronaldMastermindMasterPlan(gameState, playerId, mosjeId = 'mosje_ronald_mastermind') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player?.activeSlots.some(s => s && !s.isDefeated && s.cardId === mosjeId)) throw new Error('Ronald, The Mastermind is not on the field');
	const pick = state._pendingTargets?.discard_card;
	if (state._pendingTargets) delete state._pendingTargets.discard_card;
	const pile = player.graveyard || [];
	const entry = Number.isInteger(pick) ? pile[pick] : pile.find(c => (c.cardId ?? c) === pick);
	const cardId = entry?.cardId ?? entry;
	if (!cardId || !PIECIE_IDS.has(cardId)) throw new Error('Master Plan: choose a Piecie from your discard pile');
	const res = activatePiecieFree(state, playerId, { card: cardId, from: 'discard' }, { returnTo: 'discard', source: 'master_plan' });
	if (!res.success) throw new Error(res.error || 'Master Plan failed');
	return { state: res.state, success: true, reactionPending: res.reactionPending === true };
}
