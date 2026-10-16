// canTakeExtraUse - true when this Mosje has an activated once-per-turn ability with an Activate button (Redbull /
// Double Trigger targets). Passive, trigger and once-per-game abilities are never offered, and neither are the ones
// used inside the draw step (Coert, Martin Historian) or a reaction window (DJ 80/20): they have no button to press again.
import { MOSJES } from '../../data/mosjes.js';
import { MOSJE_ABILITY_RULES } from '../../rules/mosjeAbilityRules.js';

export function canTakeExtraUse(slot) {
	if (!slot || slot.isDefeated) return false;
	const abilityId = MOSJES.find(m => m.id === slot.cardId)?.abilityId;
	const rule = abilityId ? MOSJE_ABILITY_RULES[abilityId] : null;
	return !!rule && rule.kind === 'activated' && rule.per === 'turn' && !rule.drawStep && !rule.reactive;
}
