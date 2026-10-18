// valueOfLoss - how much worse off one Mosje is after losing `amount` MP (2.0 getemt): a loss that leaves 0 or less drops
// Level 2-3 one level at 50 MP, sends an upright Level 1 sideways at 0 MP, and a sideways Level 1 to the Welloe pile.
// Works on a plain copy: the engine's getemt helper mutates the slot.
import { roundToFive } from '../../engine/roundToFive.js';
import { slotWorth } from './slotWorth.js';

export function valueOfLoss(slot, amount) {
	const n = roundToFive(Number(amount));
	if (!slot || slot.isDefeated || !Number.isFinite(n) || n <= 0) return 0;
	const level = Math.min(3, Math.max(1, Math.round(Number(slot.level)) || 1));
	const mp = Number(slot.mp) || 0;
	if (mp - n > 0) return n;
	let after;
	if (level >= 2) after = { ...slot, level: level - 1, mp: 50 };
	else if (slot.sideways) after = null;
	else after = { ...slot, level, mp: 0, sideways: true };
	return slotWorth(slot) - slotWorth(after);
}
