// slotWorth - what one Mosje is worth to its owner: 100 per Level above 1, its MP, a bonus for Level 2 and 3, minus a
// sideways penalty. An empty or defeated slot is the Welloe pile, the worst place a Mosje can be.
import { BOT_VALUES } from './botValues.js';

export function slotWorth(slot) {
	if (!slot || slot.isDefeated) return BOT_VALUES.WELLOE_WORTH;
	const level = Math.min(3, Math.max(1, Math.round(Number(slot.level)) || 1));
	const mp = Number(slot.mp) || 0;
	return (level - 1) * 100 + mp + BOT_VALUES.LEVEL_BONUS[level - 1] - (slot.sideways ? BOT_VALUES.SIDEWAYS_PENALTY : 0);
}
