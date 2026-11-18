// FPS Coert — Headshot Precision: when this Mosje wins a Quest that rolls Str or Tech, roll a die: on a 5 or 6 it gains
// 30 MP and 1 target opponent Mosje of the owner's choice loses 15 MP (a card effect; fresh and Blensen!-shielded Mosjes
// are not offered). A Quest that rolls "your best trait" does not count (CC). A trigger inside the Quest result: no
// reaction window opens for the hit, but the Target is recorded.
import { rollDie } from '../../engine/deckEngine.js';
import { gainMP, loseMP } from '../../engine/mpManager.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { isShielded } from '../../engine/targets/isShielded.js';
import { markTargeted } from '../../engine/targets/markTargeted.js';

const KEY = 'fps_coert_target';

export const fpsCoertHeadshot = {
	mosjeId: 'mosje_fps_coert',
	run(state, ctx) {
		if (ctx.slotIndex !== ctx.holderSlotIndex || ctx.playerId !== ctx.ownerId) return state;
		if (!['strength', 'technical'].includes(ctx.quest?.rollTrait)) return state;
		const roll = ctx.roll ?? rollDie(6);
		if (roll < 5) return state;
		const oppId = Object.keys(state.players).find(id => id !== ctx.ownerId);
		const pick = state.players[ctx.ownerId]._pendingTargets?.[KEY];
		if (pick === undefined) {
			const options = isShielded(state, oppId, ctx.ownerId) ? [] : (state.players[oppId]?.activeSlots || [])
				.map((s, slotIndex) => ({ s, slotIndex }))
				.filter(({ s }) => s && !s.isDefeated && !isFresh(s))
				.map(({ s, slotIndex }) => ({ label: s.name, playerId: oppId, slotIndex }));
			// No legal target: the +30 still happens, nothing is lost.
			if (options.length === 0) return gainMP(state, ctx.ownerId, ctx.holderSlotIndex, 30, 'ABILITY');
			return { needChoice: { playerId: ctx.ownerId, choiceKind: 'oppMosje', key: KEY, options, ctx: { roll } } };
		}
		const gained = gainMP(state, ctx.ownerId, ctx.holderSlotIndex, 30, 'ABILITY');
		markTargeted(gained, pick.playerId, pick.slotIndex);
		return loseMP(gained, pick.playerId, pick.slotIndex, 15, 'ABILITY', false, ctx.ownerId);
	},
};
