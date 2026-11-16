// actionTargets - does the acting card or ability of a (held) action use Target (flag targets: true)? Pure.
// Piecie actions: the Piecie def (heldPiecieDef). Snelle: the card def of the action. Mosje ability: its rule.
// Attacks never target (rules §9).
import { heldPiecieDef } from '../../rules/heldPiecieDef.js';
import { MOSJE_ABILITY_RULES } from '../../rules/mosjeAbilityRules.js';
import { MOSJES } from '../../data/mosjes.js';

export function actionTargets(state, action) {
	const a = action?.args || [];
	switch (action?.type) {
		case 'activatePiecie':
		case 'activatePiecieFree':
		case 'resumePiecie':
			return heldPiecieDef(state, action)?.targets === true;
		case 'playSnelle':
			return a[2]?.targets === true;
		case 'resumeSnelle':
			return a[0]?.snelle?.cardDef?.targets === true;
		case 'mosjeAbility': {
			const abilityId = MOSJES.find(m => m.id === a[1])?.abilityId;
			return MOSJE_ABILITY_RULES[abilityId]?.targets === true;
		}
		default:
			return false;
	}
}
