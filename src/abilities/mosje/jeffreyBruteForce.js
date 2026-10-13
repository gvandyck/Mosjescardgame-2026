// Jeffrey, The Strongman — Brute Force (first half): whenever one of his owner's Mosjes succeeds at a Quest it gets
// +10 MP extra (a separate gain after the Quest's own win MP). The second half (no MP-giving Piecies while he is on
// the field) is the gate in engine/table/piecieActivationGate.js.
import { gainMP } from '../../engine/mpManager.js';

export const jeffreyBruteForce = {
	mosjeId: 'mosje_jeffrey',
	run(state, ctx) {
		if (ctx.playerId !== ctx.ownerId) return state;
		return gainMP(state, ctx.ownerId, ctx.slotIndex, 10, 'ABILITY');
	},
};
