// normalizeSlotMp — 2.0 backstop for unfunnelled MP writes. Returns true if changed.
import { roundToFive } from '../roundToFive.js';
import { LEVEL_UP_AT, MP_AFTER_LEVEL_UP, LEVEL3_MP_CAP } from './levelRules.js';
import { refreshLevelTraits } from './refreshLevelTraits.js';

export function normalizeSlotMp(slot, { turnNumber } = {}) {
	const before = `${slot.mp}|${slot.level}`;
	if (!Number.isFinite(slot.mp)) slot.mp = 0;
	const lv = Number(slot.level);
	slot.level = Number.isFinite(lv) ? Math.min(3, Math.max(1, Math.round(lv))) : 1;
	if (slot.mp >= LEVEL_UP_AT && slot.level < 3) {
		slot.level += 1;
		slot.mp = MP_AFTER_LEVEL_UP;
		refreshLevelTraits(slot);
		if (Number.isInteger(turnNumber)) slot.levelledUpTurn = turnNumber;
		console.log(`[ENGINE] ⬆️ ${slot.name} levelled up -> Level ${slot.level} | MP ${MP_AFTER_LEVEL_UP}`);
	}
	if (slot.level === 3 && slot.mp > LEVEL3_MP_CAP) slot.mp = LEVEL3_MP_CAP;
	if (slot.mp % 5 !== 0) slot.mp = roundToFive(slot.mp);
	if (slot.mp < 0) slot.mp = 0;
	return before !== `${slot.mp}|${slot.level}`;
}
