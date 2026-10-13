// Gandoe, The Unpredictable Wizard — Chaos Roll: at the start of your turn roll a die:
// 1-2 this Mosje loses 10 MP; 3-4 nothing; 5-6 +10 Power this turn.
import { rollDie } from '../../engine/deckEngine.js';
import { loseMP } from '../../engine/mpManager.js';

export const gandoeWizardChaosRoll = {
	mosjeId: 'mosje_gandoe_wizard',
	run(state, ctx) {
		const roll = rollDie(6);
		if (roll <= 2) return loseMP(state, ctx.ownerId, ctx.holderSlotIndex, 10, 'ABILITY', false, ctx.ownerId);
		if (roll >= 5) {
			const slot = state.players[ctx.ownerId].activeSlots[ctx.holderSlotIndex];
			slot.powerBoostThisTurn = (slot.powerBoostThisTurn || 0) + 10;
		}
		return state;
	},
};
