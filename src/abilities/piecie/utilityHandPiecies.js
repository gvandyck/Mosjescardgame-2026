// utilityHandPiecies - Card List 2.0 Utility Piecies that move cards between the hand and the discard pile:
// TemPiecie (take a card back, locked this turn) and Those Eyelashes Tho... (the opponent discards, no Snelle).
import { turnLockKey } from '../../engine/hand/turnLockKey.js';
import { cloneState } from './cloneState.js';
import { pieceDef } from './pieceDef.js';
import { gainFromPiecie } from './gainFromPiecie.js';
import { discardChoice } from './discardChoice.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';

// TemPiecie: pause over the discard pile; the card comes to the hand with lockedTurn (place / play / summon refused
// this turn - findPlayableHandIndex in every play path). An empty pile does nothing.
export function effect_tempiecie(gameState, playerId) {
	const state = cloneState(gameState);
	const me = state.players[playerId];
	const pile = me.graveyard || [];
	if (!pile.length) return state;
	const pick = me._pendingTargets?.tempiecie_card;
	if (pick === undefined) {
		const options = pile.map(e => ({ label: e.name, cardId: e.cardId })).filter((o, i, all) => all.findIndex(x => x.cardId === o.cardId) === i);
		return { state, needChoice: { playerId, choiceKind: 'discardCard', key: 'tempiecie_card', options, prompt: 'Take a card from your discard pile' } };
	}
	delete me._pendingTargets.tempiecie_card;
	let at = -1;
	pile.forEach((e, i) => { if (e.cardId === pick.cardId) at = i; });
	if (at < 0) return state;
	const [entry] = me.graveyard.splice(at, 1);
	me.hand.push({ cardId: entry.cardId, type: entry.type, faceDown: false, turnsOnField: 0, lockedTurn: turnLockKey(state) });
	return state;
}

// Those Eyelashes Tho... (Martin or West on your field - activation gate): the opponent discards 1 card of their
// choice (they pick), one of your Mosjes gains 20 MP, and the opponent can't play Snelle this turn.
export function effect_those_eyelashes(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = ctx.eyeSlot ?? resolvePiecieOwnSlot(state, playerId, 'piecie_those_eyelashes');
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const discarded = discardChoice(state, oppId, 'eyelash_discard', { eyeSlot: si });
	if (discarded.needChoice) return discarded;
	const next = si >= 0 ? gainFromPiecie(discarded, playerId, si, 20, pieceDef('piecie_those_eyelashes')) : discarded;
	next._snelleBlocked = oppId; // cleared when the opponent's turn starts
	return next;
}
