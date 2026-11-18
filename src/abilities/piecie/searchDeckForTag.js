// searchDeckForTag (D-30) - "Search your deck for a <tag> Piecie and put it in your hand", used by Mouse and MagicPrompt.
// searchDeckForTag(state, playerId, tag, key, ctx) works on a clone and returns { state, needChoice } while it needs the
// answer (the distinct Piecies of that tag in the deck, label = card name; only the searcher is asked), then moves the
// first copy of the chosen card to the hand, shuffles the deck once and returns { state, done: true }. No such card:
// the deck is still shuffled once and the search is done. An answer that is not one of the offered options is ignored.
import { cloneState } from './cloneState.js';
import { pieceDef } from './pieceDef.js';
import { shuffleDeck } from '../../engine/deckEngine.js';

export function searchDeckForTag(gameState, playerId, tag, key, ctx = {}) {
	const state = cloneState(gameState);
	const me = state.players[playerId];
	const options = [];
	for (const card of me.deck) {
		const def = pieceDef(card.cardId);
		if (def && def.tag === tag && !options.some(o => o.cardId === card.cardId)) options.push({ label: def.name, cardId: card.cardId });
	}
	const answer = me._pendingTargets?.[key];
	if (me._pendingTargets) delete me._pendingTargets[key];
	const chosen = options.find(o => o.cardId === answer?.cardId);
	if (options.length && !chosen) {
		return { state, needChoice: { playerId, choiceKind: 'handCard', key, options, prompt: `Search your deck for a ${tag} Piecie`, ctx } };
	}
	if (chosen) {
		const at = me.deck.findIndex(c => c.cardId === chosen.cardId);
		me.hand.push(...me.deck.splice(at, 1));
	}
	me.deck = shuffleDeck(me.deck);
	return { state, done: true };
}
