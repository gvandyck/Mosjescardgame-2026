// utilityPlacePiecies - Card List 2.0 Utility Place Piecies (Example-Deck cards). Effects: (state, playerId, ctx).
// Huisbaas pauses once (which Place to search for) and then plays it with playPlace, paying its cost.
import { destroyActivePlace } from '../../engine/gameState.js';
import { shuffleDeck } from '../../engine/deckEngine.js';
import { canPay } from '../../engine/energy/canPay.js';
import { playPlace } from '../../engine/turnManager.js';
import { PLACES } from '../../data/places.js';
import { triggerPlaceDestroyedEffects } from '../placeEffects.js';
import { cloneState } from './cloneState.js';

const destroyPlace = (state, playerId) => (state.activePlace ? triggerPlaceDestroyedEffects(destroyActivePlace(state), playerId) : state);
const placeDef = (cardId) => PLACES.find(p => p.id === cardId);

// Slecht Gezet: your own Place goes back to your hand; an opponent's Place is destroyed.
export function effect_slecht_gezet(gameState, playerId) {
	const state = cloneState(gameState);
	if (!state.activePlace) return state;
	if (state.activePlacePlayedBy !== playerId) return destroyPlace(state, playerId);
	state.players[playerId].hand.push({ cardId: state.activePlace, type: 'PLACE' });
	state.activePlace = null;
	state.activePlacePlayedBy = null;
	state.activePlaceTurnsActive = 0;
	return state;
}

// Shhh, popo komt!: with 3+ Mosjes on the field in total, destroy the Place.
export function effect_popo_komt(gameState, playerId) {
	const state = cloneState(gameState);
	const total = Object.values(state.players).reduce((n, p) => n + p.activeSlots.filter(s => s && !s.isDefeated).length, 0);
	return total >= 3 ? destroyPlace(state, playerId) : state;
}

// Huisbaas: destroy the Place, then optionally search your deck for a Place you can pay for and play it.
export function effect_huisbaas(gameState, playerId, ctx = {}) {
	let state = ctx.huisDestroyed ? cloneState(gameState) : destroyPlace(cloneState(gameState), playerId);
	const me = state.players[playerId];
	const pick = me._pendingTargets?.huis_place;
	if (pick === undefined) {
		const options = me.deck.filter((c, i, all) => placeDef(c.cardId) && canPay(me, Number(placeDef(c.cardId).cost) || 0)
			&& all.findIndex(x => x.cardId === c.cardId) === i).map(c => ({ label: placeDef(c.cardId).name, cardId: c.cardId }));
		if (!options.length) return state;
		options.push({ label: 'No Place', none: true });
		return { state, needChoice: { playerId, choiceKind: 'place', key: 'huis_place', options, prompt: 'Search your deck for a Place', ctx: { huisDestroyed: true } } };
	}
	delete me._pendingTargets.huis_place;
	const at = pick.none ? -1 : me.deck.findIndex(c => c.cardId === pick.cardId);
	const def = at >= 0 ? placeDef(pick.cardId) : null;
	if (def && canPay(me, Number(def.cost) || 0)) {
		const [card] = me.deck.splice(at, 1);
		me.hand.push({ cardId: card.cardId, type: 'PLACE' });
		const played = playPlace(state, playerId, { cardId: card.cardId, type: 'PLACE' }, def);
		if (played.success) state = played.state;
		else { me.hand.pop(); me.deck.splice(at, 0, card); }
	}
	state.players[playerId].deck = shuffleDeck(state.players[playerId].deck);
	return state;
}
