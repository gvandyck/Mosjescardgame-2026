// utilityProtectPiecies - Card List 2.0 Utility "protection" Piecies (Example-Deck cards). Reductions shrink a loss
// (LOSS_STEPS.staysBoundReducer reads the Stays entry), they never stop it.
import { cloneState } from './cloneState.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';
import { discardChoice } from './discardChoice.js';

// Afblijven!: Stays until the start of your next turn; the chosen Mosje loses 10 less MP each time it loses MP.
export function effect_afblijven(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_afblijven');
	const entry = ctx.slotIndex >= 0 ? state.players[playerId].piecieSlots?.[ctx.slotIndex] : null;
	if (si < 0 || !entry) return state;
	entry.boundTo = [{ playerId, slotIndex: si, cardId: state.players[playerId].activeSlots[si].cardId, reduce: 10 }];
	return state;
}

// Laat me chillen!: Stays until the end of your next turn; the next loss of any of your Mosjes is 20 less, then discard.
export function effect_laat_me_chillen(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const entry = ctx.slotIndex >= 0 ? state.players[playerId].piecieSlots?.[ctx.slotIndex] : null;
	if (entry) entry.lossReduceOnce = 20;
	return state;
}

// Mosje Shield: Stays until the end of your next turn; the chosen Mosje can't be sent to the Welloe pile
// (markMosjeDefeated reads the bound entry). The card ends with the Mosje (staysBoundGone).
export function effect_mosje_shield(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_mosje_shield');
	const entry = ctx.slotIndex >= 0 ? state.players[playerId].piecieSlots?.[ctx.slotIndex] : null;
	if (si < 0 || !entry) return state;
	entry.boundTo = [{ playerId, slotIndex: si, cardId: state.players[playerId].activeSlots[si].cardId, reduce: 0, shield: true }];
	return state;
}

// Welloe Force: the 1-card hand discard is part of the cost (a pause; the activation gate needs a card in hand).
// It then Stays until the start of your next turn; welloeForceThorns reads the staying entry.
export function effect_welloe_force(gameState, playerId) {
	const state = cloneState(gameState);
	return discardChoice(state, playerId, 'welloe_force_discard');
}
