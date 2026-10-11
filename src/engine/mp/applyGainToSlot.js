// applyGainToSlot — the one 2.0 MP gain. 100+ MP raises one Level and resets MP
// to 0 (no carry-over); Level 3 is capped at 95. Single `if`, never loops.
import { roundToFive } from '../roundToFive.js';
import { refreshLevelTraits } from './refreshLevelTraits.js';

export function applyGainToSlot(slot, amount, { turnNumber } = {}) {
	const n = Number(amount);
	if (!slot || slot.isDefeated || !Number.isFinite(n) || n <= 0) {
		return { gained: 0, leveled: false };
	}
	let leveled = false;
	slot.mp = roundToFive((slot.mp || 0) + n);
	if (slot.mp >= 100 && slot.level < 3) {
		slot.level += 1;
		slot.mp = 0;
		refreshLevelTraits(slot);
		if (Number.isInteger(turnNumber)) slot.levelledUpTurn = turnNumber;
		leveled = true;
		console.log(`[ENGINE] ⬆️ ${slot.name} levelled up -> Level ${slot.level} | MP 0`);
	}
	if (slot.level === 3 && slot.mp > 95) slot.mp = 95;
	return { gained: n, leveled };
}
