// Rugbybal: "Attach: +10 Power. An Alyssa also gains 10 MP each time she attacks." The Power is here; the gain is
// engine/attack/rugbybalAttackGain.js (afterAttack), read from rules/attachmentRules.js.
import { attachedPower } from './attachedPower.js';

export function effect_rugbybal(gameState, playerId, ctx = {}) {
	return attachedPower(gameState, playerId, ctx, 'piecie_rugbybal', () => 10);
}
