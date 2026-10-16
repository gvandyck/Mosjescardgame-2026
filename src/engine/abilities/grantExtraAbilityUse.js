// grantExtraAbilityUse - Redbull / Double Trigger: this Mosje may use its once-per-turn ability one more time this
// turn (useMosjeAbility allows maxPerTurn + extraAbilityUses uses and charges the Energy each time; the counter
// is cleared by expireThisTurnEffects and at turn start). Mutates the slot. Returns true when granted.
import { MOSJES } from '../../data/mosjes.js';
import { MOSJE_ABILITY_RULES } from '../../rules/mosjeAbilityRules.js';
import { canTakeExtraUse } from './canTakeExtraUse.js';

export function grantExtraAbilityUse(slot) {
	if (!canTakeExtraUse(slot)) return false;
	const rule = MOSJE_ABILITY_RULES[MOSJES.find(m => m.id === slot.cardId).abilityId];
	slot.extraAbilityUses = (slot.extraAbilityUses || 0) + 1;
	const used = slot.abilityUsesThisTurn ?? (slot.abilityUsedThisTurn ? 1 : 0);
	slot.abilityUsedThisTurn = used >= (rule.maxPerTurn ?? 1) + slot.extraAbilityUses; // the button is usable again
	return true;
}
