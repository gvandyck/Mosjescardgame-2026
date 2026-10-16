// attackPiecies - Card List 2.0 "Attack Piecies" section (Example-Deck cards). Effects: (state, playerId, ctx) -> state.
import { cloneState } from './cloneState.js';
import { addPowerThisTurn } from './addPowerThisTurn.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';
import { resolvePiecieOppSlot } from './resolvePiecieOppSlot.js';
import { markMosjeDefeated } from '../../engine/victoryChecker.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';
import { discardPiecieSlotInPlace } from '../../engine/table/discardPiecieSlotInPlace.js';
import { scheduleEndOfTurnLoss } from './scheduleEndOfTurnLoss.js';

// Te Hard Gaan: +20 Power this turn; at the end of the turn that Mosje loses 10 MP (runEndOfTurnLosses).
export function effect_te_hard_gaan(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_te_hard_gaan');
	if (si < 0) return state;
	addPowerThisTurn(state, playerId, si, 20);
	scheduleEndOfTurnLoss(state, playerId, { slotIndex: si, amount: 10, dueRound: state.turnNumber });
	return state;
}

// Snoeiertje: +10 Power this turn; at the end of the turn that Mosje loses 10 MP.
export function effect_snoeiertje(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_snoeiertje');
	if (si < 0) return state;
	addPowerThisTurn(state, playerId, si, 10);
	scheduleEndOfTurnLoss(state, playerId, { slotIndex: si, amount: 10, dueRound: state.turnNumber });
	return state;
}

// Continuous Assault (Stays until the end of the owner's next turn): the chosen Mosje has +10 Power while the card
// stays (powerStaysBonus, taken back by releaseBoundPower when the card or the Mosje leaves).
export function effect_continuous_assault(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_continuous_assault');
	if (si < 0) return state;
	const slot = state.players[playerId].activeSlots[si];
	const entry = ctx.slotIndex >= 0 ? state.players[playerId].piecieSlots?.[ctx.slotIndex] : null;
	if (!entry) { addPowerThisTurn(state, playerId, si, 10); return state; }
	slot.powerStaysBonus = (slot.powerStaysBonus || 0) + 10;
	entry.boundTo = [{ playerId, slotIndex: si, cardId: slot.cardId, reduce: 0, power: 10 }];
	return state;
}

// MP Hemorrhage: +20 Power this turn; arms the Mosje - its first attack puts the card next to the victim
// (mpHemorrhageMark). With no attack this turn the card is discarded at the end of the turn (sweepStaysSlots).
export function effect_mp_hemorrhage(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_mp_hemorrhage');
	if (si < 0) return state;
	addPowerThisTurn(state, playerId, si, 20);
	state.players[playerId].activeSlots[si].mpHemorrhageArmed = true;
	return state;
}

// Kleine Taks (Stays): the chosen opponent Mosje loses 10 at the end of this turn and 10 at the end of the owner's
// next turn; the card is bound to it and goes to the discard pile after that (or when the Mosje leaves play).
export function effect_kleine_taks(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const { oppId, slotIndex } = resolvePiecieOppSlot(state, playerId, 'piecie_kleine_taks');
	if (slotIndex < 0) {
		if (ctx.slotIndex >= 0) discardPiecieSlotInPlace(state, playerId, ctx.slotIndex);
		return state;
	}
	const target = state.players[oppId].activeSlots[slotIndex];
	for (const dueRound of [state.turnNumber, state.turnNumber + 1]) {
		scheduleEndOfTurnLoss(state, playerId, { targetPlayerId: oppId, slotIndex, amount: 10, dueRound });
	}
	const entry = ctx.slotIndex >= 0 ? state.players[playerId].piecieSlots?.[ctx.slotIndex] : null;
	if (entry) entry.boundTo = [{ playerId: oppId, slotIndex, cardId: target.cardId, reduce: 0 }];
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
