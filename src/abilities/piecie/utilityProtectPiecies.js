// utilityProtectPiecies - Card List 2.0 Utility "protection" Piecies (Example-Deck cards). Reductions shrink a loss
// (LOSS_STEPS.staysBoundReducer reads the Stays entry), they never stop it.
import { cloneState } from './cloneState.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';

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
