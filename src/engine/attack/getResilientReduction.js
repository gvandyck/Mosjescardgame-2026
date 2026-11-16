// getResilientReduction — 5 off an attack per Res star of the slot's current level.
// Uses the slot's own traits, not getMosjeTrait (that one has a Place override for Quests only).
import { RESILIENT_PER_STAR } from './attackRules.js';

export function getResilientReduction(targetSlot) {
	const stars = Number(targetSlot?.traits?.resilient) || 0;
	return Math.max(0, stars) * RESILIENT_PER_STAR;
}
