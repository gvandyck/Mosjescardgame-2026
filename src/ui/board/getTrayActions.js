// getTrayActions.js — the chips of the action tray for one tapped card (63-UI-SPEC "Action tray", D-03, D-06).
// getTrayActions(state, playerId, { kind: 'mosje' | 'piecie' | 'place', slotIndex }) -> [{ action, label, disabled, reason }].
// Mosje: Attack · Quest · Ability · Details. Piecie: Activate · Details. Place: Details. A disabled chip stays tappable
// and its tap shows `reason`. Pure: reads the engine rules, never changes state.
import { getMosjeTrayActions } from './getMosjeTrayActions.js';
import { getPiecieTrayActions } from './getPiecieTrayActions.js';
import { makeTrayChip } from './makeTrayChip.js';

export function getTrayActions(state, playerId, { kind, slotIndex } = {}) {
	if (kind === 'mosje') return getMosjeTrayActions(state, playerId, slotIndex);
	if (kind === 'piecie') return getPiecieTrayActions(state, playerId, slotIndex);
	return [makeTrayChip('details', 'Details')];
}
