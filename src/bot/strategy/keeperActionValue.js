// keeperActionValue - CC-2 / CC-3: the value of an attack or Quest option for the Personal Quest keeper's slot.
// Growing keeper: Quests count more, ordinary attacks less (a finishing blow stays). Level 3 keeper: only a finishing
// attack stays (0 drops it), Quests are unchanged (the Level 3 safety rule in scoreMosjeAction already filters them).
// Any other slot, or no plan: the value is returned as it is. Pure; numbers from PQ_VALUES.
import { PQ_VALUES } from './pqValues.js';

export function keeperActionValue(plan, slotIndex, option) {
	if (!plan || plan.keeperIndex !== slotIndex) return option.value;
	const finishing = option.value >= PQ_VALUES.FINISH_DROP;
	if (plan.phase === 'grow') {
		if (option.kind === 'quest') return option.value > 0 ? option.value * PQ_VALUES.GROW_WEIGHT : option.value;
		return finishing ? option.value : option.value * PQ_VALUES.KEEPER_ATTACK_WEIGHT;
	}
	if (option.kind === 'attack' && !finishing) return 0;
	return option.value;
}
