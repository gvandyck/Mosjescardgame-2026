// buildPersonalQuestMosjeOptions - option-modal rows (card faces) for "which Mosje?" of a Personal Quest (72-04, D-02).
// Legal Mosjes first, the rest greyed with the engine's reason; order otherwise kept. metaLabel is escaped (T-72-05).
import { getPersonalQuestOptions } from '../../engine/personalQuests/getPersonalQuestOptions.js';
import { getPower } from '../../engine/mp/getPower.js';
import { escapeMeta } from '../actions/escapeMeta.js';

export function buildPersonalQuestMosjeOptions(state, playerId, cardId) {
	const slots = state?.players?.[playerId]?.activeSlots || [];
	const rows = getPersonalQuestOptions(state, playerId).filter(o => o.cardId === cardId).map(o => {
		const slot = slots[o.slotIndex];
		return {
			id: String(o.slotIndex),
			card: { cardId: slot.cardId, level: slot.level, mp: slot.mp, power: getPower(slot, state, playerId) },
			label: slot.name,
			metaLabel: escapeMeta(o.ok ? `Level ${slot.level}, ${slot.mp} MP` : o.error),
			disabled: !o.ok,
		};
	});
	return [...rows.filter(r => !r.disabled), ...rows.filter(r => r.disabled)];
}
