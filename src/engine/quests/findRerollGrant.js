// findRerollGrant - index in player.rerollGrants of a usable Piecie reroll grant for `ownerId` (-1 = none).
// own: the roll being looked at is the owner's own Quest roll. Grants of an earlier turn never count.
import { djTurnKey } from '../../abilities/mosje/canDjReroll.js';

export function findRerollGrant(state, ownerId, own) {
	const grants = state?.players?.[ownerId]?.rerollGrants || [];
	return grants.findIndex(g => g.uses > 0 && g.turnKey === djTurnKey(state) && (g.scope === 'anyQuest' || (own && g.scope === 'ownQuest')));
}
