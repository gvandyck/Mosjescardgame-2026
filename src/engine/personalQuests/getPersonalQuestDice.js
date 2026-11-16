// getPersonalQuestDice - how many dice a Personal Quest attempt rolls (D-03, D-15): 1 per star of the rolled trait
// (min 1) plus every Quest dice source (Gym, player.questExtraDice) plus High Roller's Energy dice, never more than 6.
import { getQuestDiceCount } from '../quests/getQuestDiceCount.js';
import { pqRollTrait } from './pqRollTrait.js';

export function getPersonalQuestDice(state, playerId, slot, def, { energyPaid = 0 } = {}) {
	const bonus = def?.rollExtra?.bonusDicePerEnergyPaid;
	const extra = bonus ? Math.floor(energyPaid / bonus.energy) * bonus.dice : 0;
	return getQuestDiceCount(state, playerId, slot, { rollTrait: pqRollTrait(def) }, { extra });
}
