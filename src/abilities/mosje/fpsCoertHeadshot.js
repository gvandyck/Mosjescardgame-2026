// FPS Coert — Headshot Precision: when this Mosje succeeds at a Physical or Technical Quest, roll a die:
// on a 6 it gains 30 MP and one opponent Mosje of the owner's choice (not fresh) loses 15 MP.
import { rollDie } from '../../engine/deckEngine.js';
import { gainMP, loseMP } from '../../engine/mpManager.js';
import { isFresh } from '../../engine/fresh/isFresh.js';

const KEY = 'fps_coert_target';

export const fpsCoertHeadshot = {
	mosjeId: 'mosje_fps_coert',
	run(state, ctx) {
		if (ctx.slotIndex !== ctx.holderSlotIndex || ctx.playerId !== ctx.ownerId) return state;
		if (!['Physical', 'Technical'].includes(ctx.quest?.category)) return state;
		const roll = ctx.roll ?? rollDie(6);
		if (roll !== 6) return state;
		const oppId = Object.keys(state.players).find(id => id !== ctx.ownerId);
		const pick = state.players[ctx.ownerId]._pendingTargets?.[KEY];
		if (pick === undefined) {
			const options = (state.players[oppId]?.activeSlots || [])
				.map((s, slotIndex) => ({ s, slotIndex }))
				.filter(({ s }) => s && !s.isDefeated && !isFresh(s))
				.map(({ s, slotIndex }) => ({ label: s.name, playerId: oppId, slotIndex }));
			// No legal target: the +30 still happens, nothing is lost.
			if (options.length === 0) return gainMP(state, ctx.ownerId, ctx.holderSlotIndex, 30, 'ABILITY');
			return { needChoice: { playerId: ctx.ownerId, choiceKind: 'oppMosje', key: KEY, options, ctx: { roll } } };
		}
		const gained = gainMP(state, ctx.ownerId, ctx.holderSlotIndex, 30, 'ABILITY');
		return loseMP(gained, pick.playerId, pick.slotIndex, 15, 'ABILITY', false, ctx.ownerId);
	},
};
