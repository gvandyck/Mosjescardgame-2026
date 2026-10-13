// The Drainer — Continuous Drain: at the start of each opponent's turn, one of their Mosjes of the Drainer
// owner's choice loses 5 MP (a Mosje at 0 MP and a fresh Mosje can't be chosen).
import { loseMP } from '../../engine/mpManager.js';
import { isFresh } from '../../engine/fresh/isFresh.js';

const KEY = 'drainer_target';

export const drainerContinuousDrain = {
	mosjeId: 'mosje_drainer',
	run(state, ctx) {
		const pick = state.players[ctx.ownerId]._pendingTargets?.[KEY];
		if (pick === undefined) {
			const options = (state.players[ctx.playerId]?.activeSlots || [])
				.map((s, slotIndex) => ({ s, slotIndex }))
				.filter(({ s }) => s && !s.isDefeated && s.mp > 0 && !isFresh(s))
				.map(({ s, slotIndex }) => ({ label: `${s.name} (${s.mp} MP)`, playerId: ctx.playerId, slotIndex }));
			return { needChoice: { playerId: ctx.ownerId, choiceKind: 'oppMosje', key: KEY, options } };
		}
		return loseMP(state, pick.playerId, pick.slotIndex, 5, 'ABILITY', false, ctx.ownerId);
	},
};
