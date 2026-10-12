// getEligibleReactions — unique hand cardIds of Snelle that fit one of `moments` and can be played now.
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { PIECIE_SLOT_COUNT } from '../table/tableRules.js';
import { canPay } from '../energy/canPay.js';
import { isCooldownBlocked } from '../turn/isCooldownBlocked.js';

export function getEligibleReactions(state, responderId, moments) {
	const player = state?.players?.[responderId];
	if (!player || !Array.isArray(moments) || moments.length === 0) return [];
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
