// dataNeedsReason - a card def with a data `needs` list (Phase 71 fills it per card): the reason when a Need is false, else null.
// Pure. No Mosje is meant for a card Need, so slot-bound kinds look at the owner's first Mosje on the field.
import { checkNeeds } from './checkNeeds.js';

export function dataNeedsReason(state, playerId, def) {
	if (!Array.isArray(def?.needs) || !def.needs.length) return null;
	const slotIndex = (state.players[playerId]?.activeSlots || []).findIndex(s => s && !s.isDefeated);
	const res = checkNeeds({ state, playerId, slotIndex, cardId: def.id }, def.needs);
	return res.ok ? null : res.reason;
}
