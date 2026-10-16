// resolvePiecieOppSlot - which opponent Mosje a Piecie hits. The pick (state._pendingTargets.opp_slot_index, consumed)
// is re-checked against the Piecie's target table (MP limit, not fresh): a live Mosje that breaks the rule ends the
// effect (slotIndex -1, T-59-05); an empty/defeated slot falls back to the first eligible Mosje. Returns { oppId, slotIndex }.
import { piecieTargetOptions } from '../../engine/targets/piecieTargetOptions.js';

export function resolvePiecieOppSlot(state, playerId, cardId) {
	const spec = piecieTargetOptions(state, playerId, cardId).find(s => s.key === 'opp_slot_index');
	const options = (spec?.options || []).filter(o => o.playerId !== playerId);
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const chosen = state._pendingTargets?.opp_slot_index;
	if (chosen !== undefined) {
		delete state._pendingTargets.opp_slot_index;
		const live = state.players[oppId]?.activeSlots?.[chosen];
		if (Number.isInteger(chosen) && live && !live.isDefeated) {
			return { oppId, slotIndex: options.some(o => o.slotIndex === chosen) ? chosen : -1 };
		}
	}
	return { oppId, slotIndex: options.length ? options[0].slotIndex : -1 };
}
