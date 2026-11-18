// mpPiecies - Card List 2.0 "MP Piecies" section (Example-Deck cards). Effects: (state, playerId, ctx) -> state.
import { loseMP } from '../../engine/mpManager.js';
import { cloneState } from './cloneState.js';
import { pieceDef } from './pieceDef.js';
import { revealCards } from '../../engine/hidden/revealCards.js';
import { gainOwnMosje } from './gainOwnMosje.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { gainFromPiecie } from './gainFromPiecie.js';
import { resolveAnyTarget } from './resolveAnyTarget.js';
import { isFriend } from '../../engine/friends/isFriend.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';

// Varkenspootjes: a Binti gains 40, any other non-fresh Mosje (either side) loses 15.
export function effect_varkenspootjes(gameState, playerId) {
	const state = cloneState(gameState);
	const t = resolveAnyTarget(state, playerId, 'piecie_varkenspootjes');
	if (!t) return state;
	const slot = state.players[t.playerId].activeSlots[t.slotIndex];
	if (isFriend(slot, ['Binti'])) {
		return gainFromPiecie(state, playerId, t.slotIndex, 40, pieceDef('piecie_varkenspootjes'), t.playerId);
	}
	return loseMP(state, t.playerId, t.slotIndex, 15, 'DRAIN', false, playerId);
}

// Chef's Special: +15; while Ronald, The Master Chef is on your field the gain is 15 per Piecie in the opponent's
// hand instead (at least 15, at most 45).
export function effect_chefs_special(gameState, playerId) {
	const ronald = gameState.players[playerId].activeSlots.some(s => s && !s.isDefeated && s.cardId === 'mosje_ronald_chef');
	const oppId = Object.keys(gameState.players).find(id => id !== playerId);
	const seen = (gameState.players[oppId]?.hand || []).filter(c => c.type === 'PIECIE');
	const inHand = seen.length;
	// With Ronald the activator looks at the opponent's whole hand (Gandalf 2026-10-18; only the Piecies count for the gain); without Ronald nothing is shown.
	const state = ronald ? revealCards(cloneState(gameState), playerId, 'piecie_chefs_special', (gameState.players[oppId]?.hand || []).map(c => c.cardId)) : gameState;
	return gainOwnMosje(state, playerId, 'piecie_chefs_special', () => (ronald ? Math.min(45, Math.max(15, 15 * inHand)) : 15));
}

// Warm Kannetje Melk: one of your Mosjes loses 10 MP, then you draw 2 (a loss: no Binti extra).
export function effect_warm_kannetje_melk(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_warm_kannetje_melk');
	const next = si < 0 ? state : loseMP(state, playerId, si, 10, 'DRAIN', false, playerId);
	return drawFromEffect(next, playerId, 2);
}

