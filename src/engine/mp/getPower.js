// getPower — level-row Power plus boosts and the active Place's Power, a multiple of 5, never below 0.
import { getLevelRow } from './getLevelRow.js';
import { roundToFive } from '../roundToFive.js';
import { placePowerBonus } from '../../abilities/place/placePower.js';
import { getTimedTotal } from '../durations/getTimedTotal.js';

// timed effects (state.timedEffects, 70-07) are keyed by owner + slot index; find this slot by reference
function timedPower(slot, state, ownerId) {
	if (!state?.timedEffects?.length) return 0;
	const owners = ownerId ? [ownerId] : Object.keys(state.players || {});
	for (const pid of owners) {
		const i = state.players?.[pid]?.activeSlots?.indexOf(slot) ?? -1;
		if (i >= 0) return getTimedTotal(state, pid, i, 'power');
	}
	return 0;
}

export function getPower(slot, state, ownerId) {
	const base = getLevelRow(slot?.cardId, slot?.level)?.power ?? 0;
	const place = state ? placePowerBonus(state, slot, ownerId) : 0;
	const timed = timedPower(slot, state, ownerId);
	return Math.max(0, roundToFive(base + place + timed + (Number(slot?.powerBoost) || 0) + (Number(slot?.powerBoostThisTurn) || 0) + (Number(slot?.powerStaysBonus) || 0)));
}
