// The Hacker — System Hack: once per turn, pay 1 Energy (charged by useMosjeAbility): look at the top 3 cards
// of any deck (yours or the opponent's), put them back in any order and gain 10 MP.
// Inputs (state._pendingTargets): deck_owner (player id), order (the top-N indices, new top-first order).
import { gainMP } from '../../engine/mpManager.js';

export function hackerSystemHack(gameState, playerId, mosjeId = 'mosje_hacker') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	const slotIndex = player?.activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId) ?? -1;
	if (slotIndex < 0) throw new Error('The Hacker is not on the field');
	const targets = state._pendingTargets || {};
	const ownerId = targets.deck_owner ?? playerId;
	const owner = state.players[ownerId];
	if (!owner) throw new Error('Unknown deck owner');
	const n = Math.min(3, owner.deck.length);
	const order = targets.order ?? Array.from({ length: n }, (_, i) => i);
	const valid = order.length === n && [...order].sort((a, b) => a - b).every((v, i) => v === i);
	if (!valid) throw new Error('Put the top cards back in some order');
	const top = owner.deck.slice(0, n);
	owner.deck = [...order.map(i => top[i]), ...owner.deck.slice(n)];
	return gainMP(state, playerId, slotIndex, 10, 'ABILITY');
}
