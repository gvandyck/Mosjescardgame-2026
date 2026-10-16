// hitOneTarget - one Mosje takes the attacker's Power as an MP loss (modifyAmount -> loseMP -> afterLoss triggers).
// Returns { state, final } where final is the MP the target really lost.
import { loseMP } from '../mpManager.js';
import { ATTACK_TRIGGERS } from './attackTriggers.js';

export function hitOneTarget(state, { attackerPlayerId, attackerSlotIndex, targetPlayerId, targetSlotIndex, power }) {
	let s = state;
	const ctx = { state: s, attackerPlayerId, attackerSlotIndex, targetPlayerId, targetSlotIndex, amount: power };
	let amount = power;
	for (const step of ATTACK_TRIGGERS.modifyAmount) amount = step({ ...ctx, amount });
	const before = s.players[targetPlayerId].activeSlots[targetSlotIndex].mpLostThisTurn || 0;
	s = loseMP(s, targetPlayerId, targetSlotIndex, amount, 'ATTACK', false, attackerPlayerId);
	const final = (s.players[targetPlayerId].activeSlots[targetSlotIndex]?.mpLostThisTurn || 0) - before;
	for (const step of ATTACK_TRIGGERS.afterLoss) {
		s = step({ state: s, attackerPlayerId, attackerSlotIndex, targetPlayerId, targetSlotIndex, final });
	}
	return { state: s, final };
}
