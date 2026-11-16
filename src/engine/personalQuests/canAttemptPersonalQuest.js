// canAttemptPersonalQuest - may this Mosje attempt this Personal Quest now? (D-02) Pure. { ok: true } or { ok: false, error }.
// Order: card in hand, own turn / cooldown / can act / not acted, Level 3, not fresh, type, started the turn at Level 3,
// Needs, Pay.
import { canMosjeTakeAction } from '../actions/canMosjeTakeAction.js';
import { isFresh } from '../fresh/isFresh.js';
import { checkNeeds } from '../needs/checkNeeds.js';
import { canPayCosts } from '../costs/canPayCosts.js';
import { getPersonalQuestDef } from './getPersonalQuestDef.js';

export function canAttemptPersonalQuest(state, playerId, { cardId, slotIndex, choice = {} } = {}) {
	const no = (error) => ({ ok: false, error });
	const player = state?.players?.[playerId];
	const def = getPersonalQuestDef(cardId);
	if (!def) return no('That card is not a Personal Quest');
	if (!(player?.hand || []).some(c => c.cardId === cardId && c.type === 'PERSONAL_QUEST')) return no('That Personal Quest is not in your hand');
	const gate = canMosjeTakeAction(state, playerId, slotIndex);
	if (!gate.ok) return no(gate.error);
	const slot = player.activeSlots[slotIndex];
	if (slot.level !== 3) return no('Only a Level 3 Mosje can attempt a Personal Quest');
	if (isFresh(slot)) return no('A fresh Mosje cannot attempt a Personal Quest');
	if (slot.subtype !== def.mosjeType) return no(`This Personal Quest needs a ${def.mosjeType.toLowerCase()} type Mosje`);
	if (slot.levelAtTurnStart !== 3) return no('This Mosje must have started this turn at Level 3');
	const ctx = { state, playerId, slotIndex, cardId, choice, excludeCardId: cardId };
	const needs = checkNeeds(ctx, def.needs || []);
	if (!needs.ok) return no(needs.reason);
	const pay = canPayCosts(ctx, def.pay || [], choice);
	if (!pay.ok) return no(pay.reason);
	return { ok: true };
}
