// Rugbybal: an Alyssa with it attached gains 10 MP each time she attacks (once per attack, also when it hits two Mosjes).
import { gainMP } from '../mpManager.js';
import { isFriend } from '../friends/isFriend.js';
import { ATTACHMENT_RULES } from '../../rules/attachmentRules.js';

export function rugbybalAttackGain(ctx) {
	const slot = ctx.state.players[ctx.attackerPlayerId]?.activeSlots?.[ctx.attackerSlotIndex];
	if (!slot || slot.isDefeated) return ctx.state;
	let state = ctx.state;
	for (const a of slot.attachments || []) {
		const rule = ATTACHMENT_RULES[a.cardId]?.onAttackGain;
		if (rule && isFriend(slot, rule.friends)) state = gainMP(state, ctx.attackerPlayerId, ctx.attackerSlotIndex, rule.amount, 'RUGBYBAL');
	}
	return state;
}
