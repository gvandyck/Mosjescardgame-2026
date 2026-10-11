// getAbilityEnergyCost.js — up-front Energy cost of an activated ability (0 if none).
import { ABILITY_ENERGY_COSTS } from '../../rules/abilityEnergyCosts.js';

export function getAbilityEnergyCost(abilityId) {
  return ABILITY_ENERGY_COSTS[abilityId] ?? 0;
}
