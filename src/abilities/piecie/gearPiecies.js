// gearPiecies - Card List 2.0 "Gear Piecies" section (Keyboard, Mouse, Controller, Boxing Gloves, Dumbbells, Skipping Rope).
// "Only if a Digital Mosje is on your field" is checked before Energy (PIECIE_CONDITIONS).
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { cloneState } from './cloneState.js';
import { gainOwnMosje } from './gainOwnMosje.js';
import { gainFromPiecie } from './gainFromPiecie.js';
import { pieceDef } from './pieceDef.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';

export function effect_keyboard(gameState, playerId) {
	return drawFromEffect(gainOwnMosje(gameState, playerId, 'piecie_keyboard', () => 10), playerId, 1);
}

// Mouse: "Only if a Digital Mosje is on your field" (gate, before Energy). One of your Mosjes gains 10 MP; look at the
// top 2 cards of any deck (own or opponent) and put them back in any order. Pauses: which deck, then which card goes
// on top. Only the activator is offered the card names. The answers live in the activator's _pendingTargets.
const nameOf = (cardId) => toGraveyardEntry(cardId, 'x').name;

export function effect_mouse(gameState, playerId, ctx = {}) {
	let state = ctx.mouseDone ? cloneState(gameState) : gainOwnMosje(gameState, playerId, 'piecie_mouse', () => 10);
	const me = state.players[playerId];
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const decks = [{ label: 'Your deck', deck: 'own' }, { label: "Opponent's deck", deck: 'opp' }]
		.filter(o => (state.players[o.deck === 'own' ? playerId : oppId]?.deck.length || 0) >= 1);
	const targets = me._pendingTargets || {};
	if (targets.mouse_deck === undefined) {
		if (!decks.length) return state;
		return { state, needChoice: { playerId, choiceKind: 'handCard', key: 'mouse_deck', options: decks, prompt: 'Look at the top 2 cards of which deck?', ctx: { mouseDone: true } } };
	}
	const owner = state.players[targets.mouse_deck.deck === 'own' ? playerId : oppId];
	const top = owner.deck.slice(0, 2);
	const options = top.map(c => c.cardId).filter((id, i, all) => all.indexOf(id) === i).map(cardId => ({ label: `${nameOf(cardId)} on top`, cardId }));
	if (top.length === 2 && options.length > 1 && targets.mouse_top === undefined) {
		return { state, needChoice: { playerId, choiceKind: 'handCard', key: 'mouse_top', options, prompt: 'Put which card on top?', ctx: { mouseDone: true } } };
	}
	const first = top.findIndex(c => c.cardId === targets.mouse_top?.cardId);
	if (first > 0) owner.deck.splice(0, 2, top[1], top[0]);
	delete me._pendingTargets.mouse_deck;
	delete me._pendingTargets.mouse_top;
	return state;
}

export function effect_controller(gameState, playerId) {
	const state = gainOwnMosje(gameState, playerId, 'piecie_controller', () => 10);
	state.players[playerId].questExtraDice = (state.players[playerId].questExtraDice || 0) + 1; // +1 die, this turn
	return state;
}

// Boxing Gloves: Physical 2 stars or more (target table) +10 Power this turn; a Gandoe +20.
export function effect_boxing_gloves(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_boxing_gloves');
	if (si < 0) return state;
	const slot = state.players[playerId].activeSlots[si];
	const gandoe = String(slot.cardId).toLowerCase().includes('gandoe');
	slot.powerBoostThisTurn = (slot.powerBoostThisTurn || 0) + (gandoe ? 20 : 10);
	return state;
}

// Dumbbells: Physical 1 star or more (target table) +20 MP; Physical 3 stars also draws 1.
export function effect_dumbbells(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_dumbbells');
	if (si < 0) return state;
	const stars = state.players[playerId].activeSlots[si].traits?.physical || 0;
	const next = gainFromPiecie(state, playerId, si, 20, pieceDef('piecie_dumbbells'));
	return stars >= 3 ? drawFromEffect(next, playerId, 1) : next;
}

// Skipping Rope: draw 1; if one of your Mosjes has Physical 1 star or more, +1 die on a Quest this turn.
export function effect_skipping_rope(gameState, playerId) {
	const state = drawFromEffect(cloneState(gameState), playerId, 1);
	const player = state.players[playerId];
	if (player.activeSlots.some(s => s && !s.isDefeated && (s.traits?.physical || 0) >= 1)) {
		player.questExtraDice = (player.questExtraDice || 0) + 1;
	}
	return state;
}
