// mpPiecies - Card List 2.0 "MP Piecies" section (Example-Deck cards). Effects: (state, playerId, ctx) -> state.
import { loseMP } from '../../engine/mpManager.js';
import { cloneState } from './cloneState.js';
import { pieceDef } from './pieceDef.js';
import { gainOwnMosje } from './gainOwnMosje.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { gainFromPiecie } from './gainFromPiecie.js';
import { resolveAnyTarget } from './resolveAnyTarget.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';

export const effect_kannetje_melk = (s, pid) => gainOwnMosje(s, pid, 'piecie_kannetje_melk', () => 25);
export const effect_broodje_doner = (s, pid) => gainOwnMosje(s, pid, 'piecie_broodje_doner', () => 35);

// Nature's Gift (Eendjes voeren): +30, +40 with Resilient 2 stars or more.
export const effect_eendjes_voeren = (s, pid) =>
	gainOwnMosje(s, pid, 'piecie_eendjes_voeren', slot => ((slot.traits?.resilient || 0) >= 2 ? 40 : 30));

// Protein Shake: Physical 1 star or more (target table) +25; Physical 3 stars or Boxing Ring +35.
export const effect_protein_shake = (s, pid) => gainOwnMosje(s, pid, 'piecie_protein_shake',
	(slot, st) => ((slot.traits?.physical || 0) >= 3 || st.activePlace === 'place_boxing_ring' ? 35 : 25));

// Varkenspootjes: a Binti gains 40, any other non-fresh Mosje (either side) loses 15.
export function effect_varkenspootjes(gameState, playerId) {
	const state = cloneState(gameState);
	const t = resolveAnyTarget(state, playerId, 'piecie_varkenspootjes');
	if (!t) return state;
	const slot = state.players[t.playerId].activeSlots[t.slotIndex];
	if (String(slot.cardId).startsWith('mosje_binti')) {
		return gainFromPiecie(state, playerId, t.slotIndex, 40, pieceDef('piecie_varkenspootjes'), t.playerId);
	}
	return loseMP(state, t.playerId, t.slotIndex, 15, 'DRAIN', false, playerId);
}

// Momentum Boost: +15 now; the slot is flagged so a Quest win this turn gives +10 more (resolveQuestAttempt).
export function effect_momentum_boost(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_momentum_boost');
	if (si < 0) return state;
	const next = gainFromPiecie(state, playerId, si, 15, pieceDef('piecie_momentum_boost'));
	next.players[playerId].activeSlots[si].momentumBoostWin = true;
	return next;
}

// Ronald Kip: +50; while Ronald, The Master Chef is on your field +60 instead and you draw 1.
export function effect_ronald_kip(gameState, playerId) {
	const ronald = gameState.players[playerId].activeSlots.some(s => s && !s.isDefeated && s.cardId === 'mosje_ronald_chef');
	const state = gainOwnMosje(gameState, playerId, 'piecie_ronald_kip', () => (ronald ? 60 : 50));
	return ronald ? drawFromEffect(state, playerId, 1) : state;
}

// Chef's Special: +15; while Ronald, The Master Chef is on your field the gain is 15 per Piecie in the opponent's
// hand instead (at least 15, at most 45).
export function effect_chefs_special(gameState, playerId) {
	const ronald = gameState.players[playerId].activeSlots.some(s => s && !s.isDefeated && s.cardId === 'mosje_ronald_chef');
	const oppId = Object.keys(gameState.players).find(id => id !== playerId);
	const inHand = (gameState.players[oppId]?.hand || []).filter(c => c.type === 'PIECIE').length;
	return gainOwnMosje(gameState, playerId, 'piecie_chefs_special', () => (ronald ? Math.min(45, Math.max(15, 15 * inHand)) : 15));
}

// Warm Kannetje Melk: one of your Mosjes loses 10 MP, then you draw 2 (a loss: no Binti extra).
export function effect_warm_kannetje_melk(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_warm_kannetje_melk');
	const next = si < 0 ? state : loseMP(state, playerId, si, 10, 'DRAIN', false, playerId);
	return drawFromEffect(next, playerId, 2);
}

// Shoettoe: only if one of your Mosjes has 20 MP or less (gate + target table): it gains 30 MP.
export const effect_energy_surge = (s, pid) => gainOwnMosje(s, pid, 'piecie_energy_surge', () => 30);
