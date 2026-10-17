// Emergency Healings (beforeLoss): the threatened Mosje gains first, then the loss lands.
import { takeReactionMod } from '../../reactions/takeReactionMod.js';
import { applyGainToSlot } from '../applyGainToSlot.js';
import { voidBlocksGain } from '../voidBlocksGain.js';

export function emergencyHealingsStep(ctx) {
	const mod = takeReactionMod(ctx.state, 'gainFirst', ctx.playerId, ctx.slotIndex);
	if (!mod) return;
	if (voidBlocksGain(ctx.state, ctx.playerId, ctx.slotIndex, 'SNELLE')) {
		console.log('[MP] The Void active - Emergency Healings gain blocked');
		return;
	}
	console.log('[MP] Emergency Healings: +' + mod.amount + ' before the loss');
	applyGainToSlot(ctx.slot, mod.amount, { turnNumber: ctx.state.turnNumber });
}
