// Michelle, Iron Tuk — Tough Gamble: when this Mosje succeeds at a Quest, roll a die:
// 1-3 it gets half the Quest's win MP (5-grid), 4-6 double. One modifier of the single Quest gain.
import { rollDie } from '../../engine/deckEngine.js';
import { roundToFive } from '../../engine/roundToFive.js';

export const michelleToughGamble = {
	mosjeId: 'mosje_michelle',
	run(state, ctx) {
		if (ctx.slotIndex !== ctx.holderSlotIndex || ctx.playerId !== ctx.ownerId) return ctx.amount;
		const roll = rollDie(6);
		return roll >= 4 ? ctx.amount * 2 : roundToFive(ctx.amount / 2);
	},
};
