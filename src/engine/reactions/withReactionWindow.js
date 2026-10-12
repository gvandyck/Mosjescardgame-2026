// withReactionWindow — runs an action; if a player holds a fitting Snelle, pauses on state.pendingReaction instead.
import { detectReactionMoments } from './detectReactionMoments.js';
import { getEligibleReactions } from './getEligibleReactions.js';
import { buildPendingReaction } from './buildPendingReaction.js';
import { REACTION_MOMENTS as M } from './reactionMoments.js';

export function withReactionWindow(state, actorId, action, run) {
	if (action.skipReactions || state.pendingReaction) return run(state);
	const res = run(state);
	if (!(res.ok || res.success) || res.negated) return res;
	const responderId = Object.keys(state.players).find(id => id !== actorId);
	if (!responderId || !res.state?.players?.[responderId]) return res;
	const windows = [];
	const { moments, preview } = detectReactionMoments(state, res.state, { actorId, responderId, actionType: action.type });
	const eligible = getEligibleReactions(state, responderId, moments);
	if (eligible.length) windows.push({ responderId, moments, eligible, preview });
	if (action.type === 'activatePiecie') {
		const own = [M.AFTER_OWN_PIECIE_ACTIVATION];
		const e = getEligibleReactions(state, actorId, own);
		if (e.length) windows.push({ responderId: actorId, moments: own, eligible: e, preview: { getemt: [], toWelloe: false, mpLoss: {} } });
	}
	if (!windows.length) return res;
	return { state: buildPendingReaction(state, actorId, action, windows), ok: true, success: true, pending: true };
}
