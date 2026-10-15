// gearPiecies - Card List 2.0 "Gear Piecies" section (Keyboard, Controller, Boxing Gloves; Mouse is interim).
// "Only if a Digital Mosje is on your field" is checked before Energy (PIECIE_CONDITIONS).
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { cloneState } from './cloneState.js';
import { gainOwnMosje } from './gainOwnMosje.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';

export function effect_keyboard(gameState, playerId) {
	return drawFromEffect(gainOwnMosje(gameState, playerId, 'piecie_keyboard', () => 10), playerId, 1);
}

// Interim (59-05 adds the "look at the top 2 of any deck" part): +10 MP only.
export const effect_mouse = (s, pid) => gainOwnMosje(s, pid, 'piecie_mouse', () => 10);

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
