// resolvePiecieOwnSlot - which of the activator's Mosjes a Piecie hits. The pick (state._pendingTargets.own_slot_index,
// consumed) is re-checked against the Piecie's target table (piecieTargetOptions: Strength stars, MP limit ...):
// a live Mosje that breaks the rule ends the effect (-1, T-59-04); an empty/defeated slot falls back to the first
// eligible Mosje (T-55-10). Without a pick the first eligible Mosje is used.
import { piecieTargetOptions } from '../../engine/targets/piecieTargetOptions.js';
import { markTargeted } from '../../engine/targets/markTargeted.js';

export function resolvePiecieOwnSlot(state, playerId, cardId) {
	const si = pickOwnSlot(state, playerId, cardId);
	markTargeted(state, playerId, si); // the Target step (D-20); ignores -1
	return si;
}

function pickOwnSlot(state, playerId, cardId) {
	const spec = piecieTargetOptions(state, playerId, cardId).find(s => s.key === 'own_slot_index');
	const options = (spec?.options || []).filter(o => o.playerId === playerId).map(o => o.slotIndex);
	const chosen = state._pendingTargets?.own_slot_index;
	if (chosen !== undefined) {
		delete state._pendingTargets.own_slot_index;
		const live = state.players[playerId]?.activeSlots?.[chosen];
		if (Number.isInteger(chosen) && live && !live.isDefeated) return options.includes(chosen) ? chosen : -1;
	}
	return options.length ? options[0] : -1;
}
