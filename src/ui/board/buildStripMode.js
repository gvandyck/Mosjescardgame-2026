// buildStripMode.js — the status-strip message of an action mode (63-UI-SPEC "Status strip", D-04):
//   choose-target -> "Choose a target for Alyssa (Power 20)"   preview -> "Alyssa hits Ming: −20 MP (leaves 20)"
//   choose-quest  -> "Choose a Quest for Alyssa"
// A preview also carries `lines` (the breakdown; empty when the attack is blocked). Returns { kind, text, lines? } for pickStatusMessage, or null for idle / selected (the tray carries those) or a stale selection.
import { getPower } from '../../engine/mp/getPower.js';
import { parseMosjeName } from '../cardV1/parseMosjeName.js';
import { buildAttackPreview } from './buildAttackPreview.js';
import { buildAttackBreakdown } from './buildAttackBreakdown.js';

export function buildStripMode(state, localId, { mode, sel, target }) {
	const slot = sel?.kind === 'mosje' ? state?.players?.[localId]?.activeSlots?.[sel.slotIndex] : null;
	if (!slot) return null;
	const first = parseMosjeName(slot.name).firstName;
	if (mode === 'choose-target') return { kind: 'choose-target', text: `Choose a target for ${first} (Power ${getPower(slot, state, localId)})` };
	if (mode === 'choose-quest') return { kind: 'choose-quest', text: `Choose a Quest for ${first}` };
	if (mode === 'preview' && target) {
		const b = buildAttackBreakdown(state, localId, sel.slotIndex, target.playerId, target.slotIndex);
		const text = b.blocked ? b.lines[0].text : buildAttackPreview(state, localId, sel.slotIndex, target.playerId, target.slotIndex);
		return { kind: 'preview', text, lines: b.blocked ? [] : b.lines, blocked: b.blocked };
	}
	return null;
}
