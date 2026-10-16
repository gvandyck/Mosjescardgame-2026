// attackPiecies - Card List 2.0 "Attack Piecies" section (Example-Deck cards). Effects: (state, playerId, ctx) -> state.
import { cloneState } from './cloneState.js';
import { addPowerThisTurn } from './addPowerThisTurn.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';
import { resolvePiecieOppSlot } from './resolvePiecieOppSlot.js';
import { markMosjeDefeated } from '../../engine/victoryChecker.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';

// Te Hard Gaan: +20 Power this turn; at the end of the turn that Mosje loses 10 MP (runEndOfTurnLosses).
export function effect_te_hard_gaan(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_te_hard_gaan');
	if (si < 0) return state;
	addPowerThisTurn(state, playerId, si, 20);
	const p = state.players[playerId];
	p.endOfTurnLosses = [...(p.endOfTurnLosses || []), {
		slotIndex: si, cardId: p.activeSlots[si].cardId, amount: 10, dueTurnOf: playerId, dueRound: state.turnNumber,
	}];
	return state;
}

export function effect_super_saiyan_mos(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_super_saiyan_mos');
	if (si >= 0) addPowerThisTurn(state, playerId, si, 30);
	return state;
}

// Momentum Diefje: +10 Power; the flag makes momentumDiefjeGain pay +20 MP when its attack makes a Mosje lose MP.
export function effect_momentum_diefje(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_momentum_diefje');
	if (si < 0) return state;
	addPowerThisTurn(state, playerId, si, 10);
	state.players[playerId].activeSlots[si].momentumDiefjeThisTurn = true;
	return state;
}

// Dikke Taks (Level 2+ gate in the activation gate): +10 Power; its next attack this turn hits both opponent Mosjes
// (attackMosje reads hitBothOpponents); draw 1.
export function effect_dikke_taks(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_dikke_taks');
	if (si < 0) return state;
	addPowerThisTurn(state, playerId, si, 10);
	state.players[playerId].activeSlots[si].hitBothOpponents = true;
	return drawFromEffect(state, playerId, 1);
}

// Harde Didde / Klaar Met Jou: send one opponent Mosje (MP limit, not fresh - re-checked) to the Welloe pile.
function sendToWelloe(gameState, playerId, cardId) {
	const state = cloneState(gameState);
	const { oppId, slotIndex } = resolvePiecieOppSlot(state, playerId, cardId);
	return slotIndex < 0 ? state : markMosjeDefeated(state, oppId, slotIndex);
}

export const effect_harde_didde = (s, pid) => sendToWelloe(s, pid, 'piecie_harde_didde');
export const effect_klaar_met_jou = (s, pid) => drawFromEffect(sendToWelloe(s, pid, 'piecie_klaar_met_jou'), pid, 1);
