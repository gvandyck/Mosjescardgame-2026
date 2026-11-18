// beforeRollWindows - the windows that open before a Quest or Personal Quest roll (the roll is only a dry run here):
// the roller's own (beforeOwnQuestRoll: Sleutelpuntje) first, then the other player's (beforeOppQuestRoll: Oh nee toch niet).
// Returns a list of { responderId, moments, eligible }; empty when nobody holds a fitting card. One hold, one replay.
import { getEligibleReactions } from './getEligibleReactions.js';
import { REACTION_MOMENTS as M } from './reactionMoments.js';

export function beforeRollWindows(state, playerId) {
	const other = Object.keys(state.players).find(id => id !== playerId);
	const windows = [];
	for (const [who, moments] of [[playerId, [M.BEFORE_OWN_QUEST_ROLL]], [other, [M.BEFORE_OPP_QUEST_ROLL]]]) {
		const eligible = who ? getEligibleReactions(state, who, moments) : [];
		if (eligible.length) windows.push({ responderId: who, moments, eligible });
	}
	return windows;
}
