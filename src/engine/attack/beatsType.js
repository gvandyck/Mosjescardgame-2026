// beatsType — true when the attacker's type beats the target's type (rules §4). Same or unknown type: false.
import { TYPE_BEATS } from './attackRules.js';

export function beatsType(attackerType, targetType) {
	return TYPE_BEATS[attackerType] !== undefined && TYPE_BEATS[attackerType] === targetType;
}
