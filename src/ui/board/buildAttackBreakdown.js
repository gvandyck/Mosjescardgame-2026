// buildAttackBreakdown — the lines shown before Confirm (72-07, D-08, D-09). Pure: reads previewAttack, never recomputes numbers.
// Returns { lines: [{ kind, text }], final, blocked } with blocked null | 'power' | 'fresh'. Lines whose number is 0 are left out.
// Card reductions that exist only in play are not guessed; the muted note says so.
import { previewAttack } from '../../engine/attack/previewAttack.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { getTypeWord } from './getTypeWord.js';

export function buildAttackBreakdown(state, playerId, attackerSlot, targetPlayerId, targetSlot) {
	const attacker = state.players[playerId].activeSlots[attackerSlot];
	const target = state.players[targetPlayerId].activeSlots[targetSlot];
	if (isFresh(target)) return { lines: [{ kind: 'blocked', text: "Protected until its owner's next turn" }], final: 0, blocked: 'fresh' };
	const { base, triangleBonus, resilientReduction, final } = previewAttack(state, playerId, attackerSlot, targetPlayerId, targetSlot);
	if (base <= 0) return { lines: [{ kind: 'blocked', text: "Can't attack (Power 0)" }], final: 0, blocked: 'power' };
	const lines = [{ kind: 'power', text: `Power ${base}` }];
	if (triangleBonus > 0) lines.push({ kind: 'triangle', text: `Triangle +${triangleBonus} (${getTypeWord(attacker.subtype)} beats ${getTypeWord(target.subtype)})` });
	if (resilientReduction > 0) lines.push({ kind: 'resilient', text: `Resilient \u2212${resilientReduction} (Res ${Number(target.traits?.resilient) || 0})` });
	lines.push({ kind: 'total', text: `= ${final} before card effects` });
	lines.push({ kind: 'note', text: 'Card effects can change this' });
	return { lines, final, blocked: null };
}
