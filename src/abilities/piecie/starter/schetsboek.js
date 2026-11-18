// Schetsboek: "Needs: a Creative Mosje. Look at the top 2 cards of your deck. Take 1 and put the other on the bottom."
// A pause over the top 2 (only the player is asked); an answer that is not one of the offered cards is ignored.
import { cloneState } from '../cloneState.js';
import { pieceDef } from '../pieceDef.js';

export function effect_schetsboek(gameState, playerId) {
	const state = cloneState(gameState);
	const me = state.players[playerId];
	const top = me.deck.slice(0, 2);
	if (!top.length) return state;
	const options = top.map((c, index) => ({ label: pieceDef(c.cardId)?.name || c.cardId, index, cardId: c.cardId }))
		.filter((o, i, all) => all.findIndex(x => x.cardId === o.cardId) === i);
	const answer = me._pendingTargets?.schets_pick;
	if (me._pendingTargets) delete me._pendingTargets.schets_pick;
	const chosen = options.find(o => o.index === answer?.index && o.cardId === answer?.cardId);
	if (!chosen) {
		return { state, needChoice: { playerId, choiceKind: 'handCard', key: 'schets_pick', options, prompt: 'Take 1 card, the other goes to the bottom' } };
	}
	const taken = me.deck[chosen.index];
	const other = me.deck[1 - chosen.index];
	me.deck.splice(0, top.length);
	me.hand.push(taken);
	if (top.length === 2) me.deck.push(other);
	return state;
}
