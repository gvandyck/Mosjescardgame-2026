// Reaction Snelle (The Protector, Perfect Dodge, Drain Reversal): a one-shot flat loss reduction bound to the threatened slot.
import { takeReactionMod } from '../../reactions/takeReactionMod.js';

export function snelleReactionReducer(ctx) {
	const mod = takeReactionMod(ctx.state, 'reduce', ctx.playerId, ctx.slotIndex);
	if (!mod) return ctx.amount;
	console.log('[MP] Snelle reaction: loss reduced by', mod.amount);
	return Math.max(0, ctx.amount - mod.amount);
}
