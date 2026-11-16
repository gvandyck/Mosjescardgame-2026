// buildAttackPreview.js — the one-line attack preview in the status strip (63-UI-SPEC "Copywriting", D-04):
// "Alyssa hits Ming: −20 MP (leaves 20)"; a Power 0 attacker reads "Alyssa has 0 Power: no effect". First names only.
// The number is previewAttack's final value (Power + type triangle - Resilient); card shields are not guessed here.
import { previewAttack } from '../../engine/attack/previewAttack.js';
import { parseMosjeName } from '../cardV1/parseMosjeName.js';

export function buildAttackPreview(state, playerId, attackerSlot, targetPlayerId, targetSlot) {
	const attacker = state.players[playerId].activeSlots[attackerSlot];
	const target = state.players[targetPlayerId].activeSlots[targetSlot];
	const from = parseMosjeName(attacker.name).firstName;
	const to = parseMosjeName(target.name).firstName;
	const { final } = previewAttack(state, playerId, attackerSlot, targetPlayerId, targetSlot);
	if (final <= 0) return `${from} has 0 Power: no effect`;
	return `${from} hits ${to}: \u2212${final} MP (leaves ${Math.max(0, (target.mp || 0) - final)})`;
}
