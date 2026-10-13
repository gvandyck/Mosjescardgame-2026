// getEligibleReactions — unique hand cardIds of Snelle that fit one of `moments` and can be played now.
// After a Quest roll it also lists DJ 80/20's Lucky Beats as `djReroll:<dieIndex>` (one per die) when `dice`
// (or state.pendingQuestRoll.dice) exist and the responder's DJ has not rerolled this turn. Not a card: no hand, Energy or slot needed.
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { PIECIE_SLOT_COUNT } from '../table/tableRules.js';
import { canPay } from '../energy/canPay.js';
import { isCooldownBlocked } from '../turn/isCooldownBlocked.js';
import { canDjReroll } from '../../abilities/mosje/canDjReroll.js';
import { REACTION_MOMENTS as M } from './reactionMoments.js';

export const DJ_REROLL_PREFIX = 'djReroll:';

export function getEligibleReactions(state, responderId, moments, { dice } = {}) {
	const player = state?.players?.[responderId];
	if (!player || !Array.isArray(moments) || moments.length === 0) return [];
	const out = snelleReactions(state, responderId, player, moments);
	const rolled = dice ?? state.pendingQuestRoll?.dice ?? [];
	const afterRoll = moments.includes(M.AFTER_QUEST_ROLL) || moments.includes(M.AFTER_OWN_QUEST_ROLL);
	if (afterRoll && !isCooldownBlocked(state, responderId) && canDjReroll(state, responderId) >= 0) {
		rolled.forEach((_, i) => out.push(DJ_REROLL_PREFIX + i));
	}
	return out;
}

function snelleReactions(state, responderId, player, moments) {
	if (isCooldownBlocked(state, responderId) || state._snelleBlocked === responderId) return [];
	const filled = (player.piecieSlots || []).filter(Boolean).length;
	if (filled >= PIECIE_SLOT_COUNT) return [];
	const out = [];
	for (const card of player.hand || []) {
		const def = SNELLE_PIECIES.find(d => d.id === card.cardId);
		if (!def || out.includes(card.cardId)) continue;
		if (!def.reactionMoments?.some(m => moments.includes(m))) continue;
		if (!canPay(player, Number(def.cost) || 0)) continue;
		out.push(card.cardId);
	}
	return out;
}
