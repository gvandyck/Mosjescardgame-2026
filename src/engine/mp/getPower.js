// getPower — level-row Power plus boosts and the active Place's Power, a multiple of 10, never below 0.
import { getLevelRow } from './getLevelRow.js';
import { roundToTen } from './roundToTen.js';
import { placePowerBonus } from '../../abilities/place/placePower.js';

export function getPower(slot, state, ownerId) {
	const base = getLevelRow(slot?.cardId, slot?.level)?.power ?? 0;
	const place = state ? placePowerBonus(state, slot, ownerId) : 0;
	return Math.max(0, roundToTen(base + place + (Number(slot?.powerBoost) || 0) + (Number(slot?.powerBoostThisTurn) || 0) + (Number(slot?.powerStaysBonus) || 0) + (Number(slot?.powerBoostUntilOwnerTurnEnd?.amount) || 0)));
}
