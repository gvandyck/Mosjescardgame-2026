// getTriangleBonus — +10 Power for an attack when the attacker's type beats the target's, else 0.
import { TRIANGLE_BONUS } from './attackRules.js';
import { beatsType } from './beatsType.js';

export function getTriangleBonus(attackerSlot, targetSlot) {
	return beatsType(attackerSlot?.subtype, targetSlot?.subtype) ? TRIANGLE_BONUS : 0;
}
