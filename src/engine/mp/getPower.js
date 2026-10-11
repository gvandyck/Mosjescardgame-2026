// getPower — level-row Power plus boosts, a multiple of 10, never below 0.
import { getLevelRow } from './getLevelRow.js';
import { roundToTen } from './roundToTen.js';

export function getPower(slot) {
	const base = getLevelRow(slot?.cardId, slot?.level)?.power ?? 0;
	return Math.max(0, roundToTen(base + (Number(slot?.powerBoost) || 0) + (Number(slot?.powerBoostThisTurn) || 0)));
}
