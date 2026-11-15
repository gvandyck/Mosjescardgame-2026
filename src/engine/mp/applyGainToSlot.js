// applyGainToSlot — the one MP gain. 100+ MP raises one Level and resets MP
// to 10 (no carry-over); Level 3 is capped at 100. Single `if`, never loops.
import { roundToFive } from '../roundToFive.js';
import { LEVEL_UP_AT, MP_AFTER_LEVEL_UP, LEVEL3_MP_CAP } from './levelRules.js';
import { refreshLevelTraits } from './refreshLevelTraits.js';

export function applyGainToSlot(slot, amount, { turnNumber } = {}) {
	const n = Number(amount);
	if (!slot || slot.isDefeated || !Number.isFinite(n) || n <= 0) {
		return { gained: 0, leveled: false };
	}
	let leveled = false;
	slot.mp = roundToFive((slot.mp || 0) + n);
	if (slot.mp >= LEVEL_UP_AT && slot.level < 3) {
		slot.level += 1;
		slot.mp = MP_AFTER_LEVEL_UP;
		refreshLevelTraits(slot);
		if (Number.isInteger(turnNumber)) slot.levelledUpTurn = turnNumber;
		leveled = true;
		console.log(`[ENGINE] ⬆️ ${slot.name} levelled up -> Level ${slot.level} | MP ${MP_AFTER_LEVEL_UP}`);
	}
	if (slot.level === 3 && slot.mp > LEVEL3_MP_CAP) slot.mp = LEVEL3_MP_CAP;
	// Tactician set: a gain is kept (added to the delta); a level-up ends the set early (real result stays).
	if (slot.tacticianSet) {
		if (leveled) delete slot.tacticianSet;
		else slot.tacticianSet.delta += n;
	}
	return { gained: n, leveled };
}
