// withReactionWindow — runs an action; if a player holds a fitting Snelle, pauses on state.pendingReaction instead.
import { detectReactionMoments } from './detectReactionMoments.js';
import { getEligibleReactions } from './getEligibleReactions.js';
import { buildPendingReaction } from './buildPendingReaction.js';
import { REACTION_MOMENTS as M } from './reactionMoments.js';

export function withReactionWindow(state, actorId, action, run) {
	if (action.skipReactions || state.pendingReaction) return run(state);
	const res = run(state);
	if (!(res.ok || res.success) || res.negated) return res;
	if (['piecie', 'snelle'].includes(res.state?.pendingChoice?.hook)) return res; // paused Piecie: the window opens when it finishes
	const responderId = Object.keys(state.players).find(id => id !== actorId);
	if (!responderId || !res.state?.players?.[responderId]) return res;
	const windows = [];
	const { moments, preview } = detectReactionMoments(state, res.state, { actorId, responderId, actionType: action.type });
	const eligible = getEligibleReactions(state, responderId, moments, { action, preview, actorId });
	if (eligible.length) windows.push({ responderId, moments, eligible, preview });
	if (action.type === 'activatePiecie' || action.type === 'activatePiecieFree') {
		const own = [M.AFTER_OWN_PIECIE_ACTIVATION];
		const e = getEligibleReactions(state, actorId, own, { action, actorId });
		if (e.length) windows.push({ responderId: actorId, moments: own, eligible: e, preview: { getemt: [], toWelloe: false, mpLoss: {} } });
	}
	if (!windows.length) return res;
	// hold: a resumed (paused) activation is already finished - the window keeps its result instead of replaying it.
	if (action.hold) return { state: buildPendingReaction(res.state, actorId, { type: 'heldResult', args: [] }, windows), ok: true, success: true, reactionPending: true };
	return { state: buildPendingReaction(state, actorId, action, windows), ok: true, success: true, reactionPending: true };
}
