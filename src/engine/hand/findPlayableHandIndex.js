// findPlayableHandIndex - the hand index of a copy that may be placed / played / summoned now. A card TemPiecie took
// from the discard pile carries lockedTurn (see turnLockKey) and can't be used in the turn it came back.
// Returns { index, error }: index -1 with the error text when there is no usable copy.
import { turnLockKey } from './turnLockKey.js';

export function findPlayableHandIndex(state, hand, match) {
	const key = turnLockKey(state);
	const index = hand.findIndex(c => match(c) && c.lockedTurn !== key);
	if (index >= 0) return { index, error: null };
	return { index: -1, error: hand.some(match) ? "TemPiecie: you can't place or play that card this turn" : 'Card not in hand' };
}
