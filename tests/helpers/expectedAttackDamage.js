// expectedAttackDamage.js - Phase 72.1-02: the MP an attack takes off a target, worked out from the 2.1 rules (handover/rules.md
// section 4, ruling 15 Nov: Power incl. boosts + triangle, then Resilient -5 per star), never read back from the game.
// Triangle: Physical beats Digital, Digital beats Creative, Creative beats Physical: +10 Power when attacking the type you beat.
const BEATS = { PHYSICAL: 'DIGITAL', DIGITAL: 'CREATIVE', CREATIVE: 'PHYSICAL' };

/** @param {number} power the attacker's Power (boosts included) @param {string} attackerType @param {{ subtype: string, traits?: { resilient?: number } }} target */
export function expectedAttackDamage(power, attackerType, target) {
	const triangle = BEATS[attackerType] === target.subtype ? 10 : 0;
	const resilient = 5 * (Number(target.traits?.resilient) || 0);
	return Math.max(5, power + triangle - resilient);
}
