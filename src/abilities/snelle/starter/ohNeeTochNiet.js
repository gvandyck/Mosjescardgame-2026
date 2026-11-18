// Oh nee toch niet (snelle_emergency_healings): "When your opponent starts a Quest: they roll 1 die less." Played in the
// beforeOppQuestRoll window: a -1 die grant for the roller, this turn only. The dice count never goes under 1 (getQuestDiceCount),
// and the grant is used up by the held roll, so it does not reach that player's next Quest.
import { addQuestDiceGrant } from '../../../engine/quests/addQuestDiceGrant.js';

export function effect_snelle_emergency_healings(gameState, pid, ctx = {}) {
	const rollerId = ctx.reaction?.actorId;
	if (!rollerId || rollerId === pid || !ctx.reaction.moments?.includes('beforeOppQuestRoll')) return gameState;
	const state = JSON.parse(JSON.stringify(gameState));
	return addQuestDiceGrant(state, rollerId, { amount: -1, lasts: 'thisTurn', sourceCardId: 'snelle_emergency_healings' });
}
