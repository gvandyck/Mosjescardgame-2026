// utilityHandPiecies - Card List 2.0 Utility Piecies that move cards between the hand and the discard pile:
// TemPiecie (take a card back, locked this turn) and Those Eyelashes Tho... (the opponent discards, no Snelle).
import { isFallenMosje } from '../../engine/pile/isFallenMosje.js';
import { turnLockKey } from '../../engine/hand/turnLockKey.js';
import { cloneState } from './cloneState.js';
import { opponentDiscardChoice } from './opponentDiscardChoice.js';

// TemPiecie: pause over the discard pile; the card comes to the hand with lockedTurn (place / play / summon refused
// this turn - findPlayableHandIndex in every play path). An empty pile does nothing.
export function effect_tempiecie(gameState, playerId) {
	const state = cloneState(gameState);
	const me = state.players[playerId];
	const pile = (me.graveyard || []).filter(e => !isFallenMosje(e)); // a fallen Mosje is not a discard
	if (!pile.length) return state;
	const pick = me._pendingTargets?.tempiecie_card;
	if (pick === undefined) {
		const options = pile.map(e => ({ label: e.name, cardId: e.cardId })).filter((o, i, all) => all.findIndex(x => x.cardId === o.cardId) === i);
		return { state, needChoice: { playerId, choiceKind: 'discardCard', key: 'tempiecie_card', options, prompt: 'Take a card from your discard pile' } };
	}
	delete me._pendingTargets.tempiecie_card;
	let at = -1;
	me.graveyard.forEach((e, i) => { if (!isFallenMosje(e) && e.cardId === pick.cardId) at = i; });
	if (at < 0) return state;
	const [entry] = me.graveyard.splice(at, 1);
	me.hand.push({ cardId: entry.cardId, type: entry.type, faceDown: false, turnsOnField: 0, lockedTurn: turnLockKey(state) });
	return state;
}

// Those Eyelashes Tho... (Needs a Martin or a West, data on the card): the opponent discards 1 card of their choice
// (never a Personal Quest) and can't play Snelle this turn. No MP (2.1 text).
export function effect_those_eyelashes(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const discarded = opponentDiscardChoice(state, oppId, playerId, 'eyelash_discard', {});
	if (discarded.needChoice) return discarded;
	discarded._snelleBlocked = oppId; // cleared when the opponent's turn starts
	return discarded;
}
