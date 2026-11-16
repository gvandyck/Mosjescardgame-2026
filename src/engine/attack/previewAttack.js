// previewAttack — pure: what an attack would do, before card shields (none are guessed). Never changes state.
import { getPower } from '../mp/getPower.js';
import { getTriangleBonus } from './getTriangleBonus.js';
import { getResilientReduction } from './getResilientReduction.js';
import { MIN_ATTACK_LOSS } from './attackRules.js';

export function previewAttack(state, attackerPlayerId, attackerSlotIndex, targetPlayerId, targetSlotIndex) {
	const attacker = state.players[attackerPlayerId].activeSlots[attackerSlotIndex];
	const target = state.players[targetPlayerId].activeSlots[targetSlotIndex];
	const base = getPower(attacker, state, attackerPlayerId);
	if (base <= 0) return { base: 0, triangleBonus: 0, resilientReduction: 0, final: 0 };
	const triangleBonus = getTriangleBonus(attacker, target);
	const resilientReduction = getResilientReduction(target);
	const final = Math.max(MIN_ATTACK_LOSS, base + triangleBonus - resilientReduction);
	return { base, triangleBonus, resilientReduction, final };
}
