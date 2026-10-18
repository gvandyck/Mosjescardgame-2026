// valueOfGain - how much better off one Mosje is after a gain of `amount` MP (2.0 level rule): reaching 100 MP raises the
// level and resets MP to 0, Level 3 stops at 95. Works on a plain copy: the engine's gain helper logs and mutates.
import { roundToFive } from '../../engine/roundToFive.js';
import { BOT_VALUES } from './botValues.js';
import { slotWorth } from './slotWorth.js';

export function valueOfGain(slot, amount) {
	const n = roundToFive(Number(amount));
	if (!slot || slot.isDefeated || !Number.isFinite(n) || n <= 0) return 0;
	const level = Math.min(3, Math.max(1, Math.round(Number(slot.level)) || 1));
	const mp = Number(slot.mp) || 0;
	const after = { ...slot, level, mp: mp + n };
	if (level < 3 && mp + n >= 100) {
		after.level = level + 1;
		after.mp = 0;
	} else if (level === 3) {
		after.mp = Math.min(BOT_VALUES.L3_MP_CAP, mp + n);
	}
	return slotWorth(after) - slotWorth(slot);
}
