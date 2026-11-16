// summonFromWelloe - puts one Mosje from the owner's Welloe pile onto the first free Mosje spot (mutates the cloned
// state). Level 1, MP = starting MP + bonus, fresh (createMosjeSlot sets entryProtected). Returns the slot index or -1.
import { MOSJES } from '../../data/mosjes.js';
import { createMosjeSlot } from '../../engine/mp/createMosjeSlot.js';
import { getPileMosjes } from '../../engine/pile/getPileMosjes.js';
import { takeMosjeFromPile } from '../../engine/pile/takeMosjeFromPile.js';
import { canLeaveWelloePile } from '../../engine/table/canLeaveWelloePile.js';

export function summonFromWelloe(state, playerId, mosjeCardId, bonusMp = 0) {
	const player = state.players[playerId];
	if (!player || !canLeaveWelloePile(state)) return -1;
	const def = MOSJES.find(m => m.id === mosjeCardId);
	const free = (player.activeSlots || []).findIndex(s => s === null);
	if (!def || free < 0 || !getPileMosjes(player).some(e => e.cardId === mosjeCardId)) return -1;
	takeMosjeFromPile(player, mosjeCardId);
	player.activeSlots[free] = createMosjeSlot(def, { level: 1, mp: (def.startMP ?? 0) + bonusMp });
	return free;
}
