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
		slot.levelUpProtected = true; // R2
		leveled = true;
		console.log(`[ENGINE] ⬆️ ${slot.name} levelled up -> Level ${slot.level} | MP 0`);
	}
	if (slot.level === 3 && slot.mp > 95) slot.mp = 95;
	// Tactician set: a gain is kept (added to the delta); a level-up ends the set early (real result stays).
	if (slot.tacticianSet) {
		if (leveled) delete slot.tacticianSet;
		else slot.tacticianSet.delta += n;
	}
	return { gained: n, leveled };
}
