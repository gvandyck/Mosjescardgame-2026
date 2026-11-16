// hitOneTarget - one Mosje takes the attacker's Power as an MP loss (modifyAmount -> loseMP -> afterLoss triggers).
// Returns { state, final } where final is the MP the target really lost.
import { loseMP } from '../mpManager.js';
import { ATTACK_TRIGGERS } from './attackTriggers.js';
import { getTriangleBonus } from './getTriangleBonus.js';

export function hitOneTarget(state, { attackerPlayerId, attackerSlotIndex, targetPlayerId, targetSlotIndex, power }) {
	let s = state;
	const ctx = { state: s, attackerPlayerId, attackerSlotIndex, targetPlayerId, targetSlotIndex, amount: power };
	// Type triangle (rules §4): +10 Power for this attack against this target. Power 0 stays no attack.
	let amount = power > 0 ? power + getTriangleBonus(s.players[attackerPlayerId].activeSlots[attackerSlotIndex], s.players[targetPlayerId].activeSlots[targetSlotIndex]) : power;
	ctx.amount = amount;
	for (const step of ATTACK_TRIGGERS.modifyAmount) amount = step({ ...ctx, amount });
	const before = s.players[targetPlayerId].activeSlots[targetSlotIndex].mpLostThisTurn || 0;
	s = loseMP(s, targetPlayerId, targetSlotIndex, amount, 'ATTACK', false, attackerPlayerId);
	const final = (s.players[targetPlayerId].activeSlots[targetSlotIndex]?.mpLostThisTurn || 0) - before;
	for (const step of ATTACK_TRIGGERS.afterLoss) {
		s = step({ state: s, attackerPlayerId, attackerSlotIndex, targetPlayerId, targetSlotIndex, final });
	}
	return { state: s, final };
}
