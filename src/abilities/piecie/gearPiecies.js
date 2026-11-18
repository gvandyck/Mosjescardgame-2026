// gearPiecies - Card List 2.0 "Gear Piecies" section (Keyboard, Boxing Gloves, Dumbbells, Skipping Rope).
// "Only if a Digital Mosje is on your field" is checked before Energy (PIECIE_CONDITIONS).
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { cloneState } from './cloneState.js';
import { gainOwnMosje } from './gainOwnMosje.js';
import { gainFromPiecie } from './gainFromPiecie.js';
import { pieceDef } from './pieceDef.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';

export function effect_keyboard(gameState, playerId) {
	return drawFromEffect(gainOwnMosje(gameState, playerId, 'piecie_keyboard', () => 10), playerId, 1);
}

// Boxing Gloves: Strength 2 stars or more (target table) +10 Power this turn; a Gandoe +20.
export function effect_boxing_gloves(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_boxing_gloves');
	if (si < 0) return state;
	const slot = state.players[playerId].activeSlots[si];
	const gandoe = String(slot.cardId).toLowerCase().includes('gandoe');
	slot.powerBoostThisTurn = (slot.powerBoostThisTurn || 0) + (gandoe ? 20 : 10);
	return state;
}

// Dumbbells: Strength 1 star or more (target table) +20 MP; Strength 3 stars also draws 1.
export function effect_dumbbells(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_dumbbells');
	if (si < 0) return state;
	const stars = state.players[playerId].activeSlots[si].traits?.strength || 0;
	const next = gainFromPiecie(state, playerId, si, 20, pieceDef('piecie_dumbbells'));
	return stars >= 3 ? drawFromEffect(next, playerId, 1) : next;
}

// Skipping Rope: draw 1; if one of your Mosjes has Strength 1 star or more, +1 die on a Quest this turn.
export function effect_skipping_rope(gameState, playerId) {
	const state = drawFromEffect(cloneState(gameState), playerId, 1);
	const player = state.players[playerId];
	if (player.activeSlots.some(s => s && !s.isDefeated && (s.traits?.strength || 0) >= 1)) {
		player.questExtraDice = (player.questExtraDice || 0) + 1;
	}
	return state;
}
