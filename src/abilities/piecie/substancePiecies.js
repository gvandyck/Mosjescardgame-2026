// substancePiecies - Card List 2.0 "Substance Piecies" section (Example-Deck cards). Effects: (state, playerId, ctx).
// Pauses: Dikke Jonko (the opponent picks a Mosje) and Larry / Zegeltje (discard 1) return { state, needChoice }.
import { loseMP, gainMP } from '../../engine/mpManager.js';
import { rollDie } from '../../engine/deckEngine.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { destroyActivePlace } from '../../engine/gameState.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { resolveOppTargetSlot } from '../../engine/targets/resolveOppTargetSlot.js';
import { cloneState } from './cloneState.js';
import { pieceDef } from './pieceDef.js';
import { gainFromPiecie } from './gainFromPiecie.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';
import { discardChoice } from './discardChoice.js';
import { triggerPlaceDestroyedEffects } from '../placeEffects.js';

const oppOf = (state, pid) => Object.keys(state.players).find(id => id !== pid) || null;
// One of your Mosjes loses `loss` or gains `gain` MP (the pick comes from the Piecie's target table).
const ownMosje = (s, pid, id, loss, gain) => {
	const si = resolvePiecieOwnSlot(s, pid, id);
	if (si < 0) return s;
	return loss ? loseMP(s, pid, si, loss, 'DRAIN', false, pid) : gainFromPiecie(s, pid, si, gain, pieceDef(id));
};

export function effect_grammetje_pieter(gameState, playerId) {
	const state = cloneState(gameState);
	const win = rollDie(6) >= 4;
	return win ? ownMosje(state, playerId, 'piecie_grammetje_pieter', 0, 30) : ownMosje(state, playerId, 'piecie_grammetje_pieter', 15, 0);
}

export function effect_dikke_jonko(gameState, playerId, ctx = {}) {
	let state = cloneState(gameState);
	const oppId = oppOf(state, playerId);
	if (!ctx.jonkoSelfDone) state = ownMosje(state, playerId, 'piecie_dikke_jonko', 0, 25);
	const opp = state.players[oppId];
	const pick = opp?._pendingTargets?.jonko_slot;
	if (opp && pick === undefined) {
		const options = opp.activeSlots.map((s, slotIndex) => ({ s, slotIndex })).filter(({ s }) => s && !s.isDefeated)
			.map(({ s, slotIndex }) => ({ label: s.name, slotIndex }));
		if (options.length) {
			return { state, needChoice: { playerId: oppId, choiceKind: 'ownMosje', key: 'jonko_slot', options, ctx: { jonkoSelfDone: true } } };
		}
	} else if (opp) {
		delete opp._pendingTargets.jonko_slot;
		state = gainMP(state, oppId, pick.slotIndex, 10, 'PIECIE');
	}
	return drawFromEffect(drawFromEffect(state, playerId, 1), oppId, 1);
}

// Affoe: an opponent Mosje loses 15, one of yours gains 10. A fresh opponent pick makes the whole card fizzle.
export function effect_affoe(gameState, playerId) {
	let state = cloneState(gameState);
	const oppId = oppOf(state, playerId);
	const osi = resolveOppTargetSlot(state, oppId);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_affoe');
	if (osi < 0 || isFresh(state.players[oppId].activeSlots[osi])) return state;
	state = loseMP(state, oppId, osi, 15, 'DRAIN', false, playerId);
	return si < 0 ? state : gainFromPiecie(state, playerId, si, 10, pieceDef('piecie_affoe'));
}

// Straffoe: one of yours loses 5, each opponent Mosje loses 10 (a fresh one is skipped by the loss pipeline).
export function effect_straffoe(gameState, playerId) {
	let state = ownMosje(cloneState(gameState), playerId, 'piecie_straffoe', 5, 0);
	const oppId = oppOf(state, playerId);
	state.players[oppId].activeSlots.forEach((s, i) => {
		if (s && !s.isDefeated) state = loseMP(state, oppId, i, 10, 'DRAIN', false, playerId);
	});
	return state;
}

// Tikker: +40, and the Piecie Stays next to that Mosje (blockedMosjeSlot): it can't Quest on the owner's next turn.
export function effect_tikker(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_tikker');
	if (si < 0) return state;
	const entry = ctx.slotIndex >= 0 ? state.players[playerId].piecieSlots?.[ctx.slotIndex] : null;
	if (entry) entry.blockedMosjeSlot = si;
	return gainFromPiecie(state, playerId, si, 40, pieceDef('piecie_tikker'));
}

// Larry / Zegeltje: roll for one Mosje: 1-2 loses 25 and you discard 1; 3-4 gains 20; 5-6 gains 40 and you draw 2.
export function effect_larry_zegeltje(gameState, playerId, ctx = {}) {
	let state = cloneState(gameState);
	let roll = ctx.larryRoll;
	if (roll === undefined) {
		roll = rollDie(6);
		if (roll <= 2) state = ownMosje(state, playerId, 'piecie_larry_zegeltje', 25, 0);
		else if (roll <= 4) state = ownMosje(state, playerId, 'piecie_larry_zegeltje', 0, 20);
		else state = drawFromEffect(ownMosje(state, playerId, 'piecie_larry_zegeltje', 0, 40), playerId, 2);
	}
	return roll <= 2 ? discardChoice(state, playerId, 'larry_discard', { larryRoll: roll }) : state;
}

export function effect_bong_hit_demolition(gameState, playerId) {
	let state = cloneState(gameState);
	if (state.activePlace) {
		state = destroyActivePlace(state);
		state = triggerPlaceDestroyedEffects(state, playerId);
	}
	return drawFromEffect(state, playerId, 2);
}
