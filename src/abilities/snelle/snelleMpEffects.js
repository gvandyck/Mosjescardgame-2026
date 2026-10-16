// snelleMpEffects - Card List 2.0 Snelle that gain / lose MP, draw or fetch a Place (Phase 60). Effects: (state, playerId, ctx).
// A pick that needs the player returns { state, needChoice } (see runSnelleEffect). Gains go through gainMP('SNELLE').
import { gainMP, loseMP } from '../../engine/mpManager.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { pickMosje, clearPicks } from './pickMosje.js';

const clone = (s) => JSON.parse(JSON.stringify(s));

function gainOnPick(gameState, pid, key, amount, prompt, filter) {
	const state = clone(gameState);
	const pick = pickMosje(state, pid, key, 'own', prompt, filter);
	if (pick.none) return state;
	if (pick.needChoice) return { state, needChoice: pick.needChoice };
	clearPicks(state, pid, key);
	return gainMP(state, pid, pick.slot.slotIndex, amount, 'SNELLE');
}

export const effect_snelle_momentum_rush = (s, pid) => gainOnPick(s, pid, 'rush_slot', 15, 'Momentum Rush: which Mosje gains 15 MP?');

export const effect_snelle_bijna_welloe = (s, pid) =>
	gainOnPick(s, pid, 'welloe_slot', 20, 'Bijna Welloe: which Mosje gains 20 MP?', m => m.mp <= 10);

export function effect_snelle_ff_haaltje_nemen(gameState, pid) {
	return drawFromEffect(clone(gameState), pid, 2);
}

// Chillingsvoorbij!: the most recently discarded Place of yours goes back to your hand.
export function effect_snelle_chillingsvoorbij(gameState, pid) {
	const state = clone(gameState);
	const player = state.players[pid];
	const i = (player.graveyard || []).map(c => c?.type).lastIndexOf('PLACE');
	if (i < 0) return state;
	const [place] = player.graveyard.splice(i, 1);
	player.hand.push({ cardId: place.cardId, type: 'PLACE' });
	return state;
}

// Jantje Jantje... Jantje?: one opponent Mosje loses 15 and one of yours gains 15 (Bank Chilling is checked before play).
export function effect_snelle_jantje_jantje_jantje(gameState, pid) {
	let state = clone(gameState);
	const opp = pickMosje(state, pid, 'jantje_opp', 'opp', 'Jantje Jantje... Jantje?: which opponent Mosje loses 15 MP?');
	if (opp.needChoice) return { state, needChoice: opp.needChoice };
	const own = pickMosje(state, pid, 'jantje_own', 'own', 'Jantje Jantje... Jantje?: which of your Mosjes gains 15 MP?');
	if (own.needChoice) return { state, needChoice: own.needChoice };
	clearPicks(state, pid, 'jantje_opp', 'jantje_own');
	if (opp.slot) state = loseMP(state, opp.slot.playerId, opp.slot.slotIndex, 15, 'SNELLE', false, pid);
	if (own.slot) state = gainMP(state, pid, own.slot.slotIndex, 15, 'SNELLE');
	return state;
}
