// summonFromWelloe - puts one Mosje from the owner's Welloe pile onto the first free Mosje spot (mutates the cloned
// state). Level 1, MP = starting MP + bonus, fresh (createMosjeSlot sets entryProtected). Returns the slot index or -1.
import { MOSJES } from '../../data/mosjes.js';
import { createMosjeSlot } from '../../engine/mp/createMosjeSlot.js';
import { canLeaveWelloePile } from '../../engine/table/canLeaveWelloePile.js';

export function summonFromWelloe(state, playerId, mosjeCardId, bonusMp = 0) {
	const player = state.players[playerId];
	if (!player || !canLeaveWelloePile(state)) return -1;
	const at = (player.welloePile || []).findIndex(e => e.type === 'MOSJE' && e.cardId === mosjeCardId);
	const def = MOSJES.find(m => m.id === mosjeCardId);
	const free = (player.activeSlots || []).findIndex(s => s === null);
	if (at < 0 || !def || free < 0) return -1;
	player.welloePile.splice(at, 1);
	player.activeSlots[free] = createMosjeSlot(def, { level: 1, mp: (def.startMP ?? 0) + bonusMp });
	return free;
}
