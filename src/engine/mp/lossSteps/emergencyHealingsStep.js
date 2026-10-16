// Emergency Healings (beforeLoss): the threatened Mosje gains first, then the loss lands.
import { takeReactionMod } from '../../reactions/takeReactionMod.js';
import { applyGainToSlot } from '../applyGainToSlot.js';

export function emergencyHealingsStep(ctx) {
	const mod = takeReactionMod(ctx.state, 'gainFirst', ctx.playerId, ctx.slotIndex);
	if (!mod) return;
	console.log('[MP] Emergency Healings: +' + mod.amount + ' before the loss');
	applyGainToSlot(ctx.slot, mod.amount, { turnNumber: ctx.state.turnNumber });
}
