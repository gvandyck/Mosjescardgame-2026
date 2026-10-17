// attackRevealPiecies - Jantje Jantje... (Card List 2.0): name a card, then look at the opponent's hand. Only the hit
// or the miss is shown to the actor (T-59-12). Pause: the actor names the card (cardName); the Mosje pick is carried in ctx.
import { loseMP } from '../../engine/mpManager.js';
import { ALL_CARDS } from '../../data/cardIndex.js';
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';
import { revealCards } from '../../engine/hidden/revealCards.js';
import { cloneState } from './cloneState.js';
import { addPowerThisTurn } from './addPowerThisTurn.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';

const KEY = 'jantje_name';
const nameOf = (cardId) => toGraveyardEntry(cardId, 'x').name;
// One option per distinct card name that can be in a hand (Quest cards are not).
const NAMES = [...new Map(ALL_CARDS.filter(c => c.type !== 'QUEST').map(c => [c.name, { label: c.name, cardId: c.id }])).values()]
	.sort((a, b) => a.label.localeCompare(b.label));

export function effect_jantje_jantje(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const me = state.players[playerId];
	const si = ctx.jantjeSlot ?? resolvePiecieOwnSlot(state, playerId, 'piecie_jantje_jantje');
	if (si < 0) return state;
	const pick = me._pendingTargets?.[KEY];
	if (pick === undefined) {
		return { state, needChoice: { playerId, choiceKind: 'cardName', key: KEY, options: NAMES, prompt: "Name a card (then you look at your opponent's hand)", ctx: { jantjeSlot: si } } };
	}
	delete me._pendingTargets[KEY];
	const opp = state.players[Object.keys(state.players).find(id => id !== playerId)];
	revealCards(state, playerId, 'piecie_jantje_jantje', opp.hand.map(c => c.cardId)); // "look at your opponent's hand"
	const at = opp.hand.findIndex(c => nameOf(c.cardId) === pick.label);
	if (at < 0) return loseMP(state, playerId, si, 10, 'DRAIN', false, playerId);
	const [card] = opp.hand.splice(at, 1);
	opp.graveyard = [...(opp.graveyard || []), toGraveyardEntry(card.cardId, 'discarded')];
	addPowerThisTurn(state, playerId, si, 20);
	return state;
}
