// withReactionWindow — runs an action; if a player holds a fitting Snelle, pauses on state.pendingReaction instead.
import { detectReactionMoments, PIECIE_ACTIONS } from './detectReactionMoments.js';
import { getEligibleReactions } from './getEligibleReactions.js';
import { buildPendingReaction } from './buildPendingReaction.js';
import { REACTION_MOMENTS as M } from './reactionMoments.js';
import { actionTargets } from '../targets/actionTargets.js';
import { takeTargeted } from '../targets/takeTargeted.js';

// A returned state never carries the Target record (D-20).
function finish(res) {
	if (res?.state?.targetedThisAction) delete res.state.targetedThisAction;
	return res;
}

export function withReactionWindow(state, actorId, action, run) {
	if (action.skipReactions || state.pendingReaction) return finish(run(state));
	const res = run(state);
	if (!(res.ok || res.success) || res.negated) return res;
	if (['piecie', 'snelle'].includes(res.state?.pendingChoice?.hook)) return res; // paused Piecie: the window opens when it finishes
	if (action.type === 'mosjeAbility' && res.state?.pendingReaction) return finish(res); // Master Plan's free activation opened its own window
	const recorded = takeTargeted(res.state); // D-20: the Target record lives only until here
	const responderId = Object.keys(state.players).find(id => id !== actorId);
	if (!responderId || !res.state?.players?.[responderId]) return res;
	const windows = [];
	const { moments, preview } = detectReactionMoments(state, res.state, { actorId, responderId, actionType: action.type, targets: actionTargets(state, action), recorded });
	const eligible = getEligibleReactions(state, responderId, moments, { action, preview, actorId });
	if (eligible.length) windows.push({ responderId, moments, eligible, preview });
	if (PIECIE_ACTIONS.includes(action.type)) {
		const own = [M.AFTER_OWN_PIECIE_ACTIVATION];
		const e = getEligibleReactions(state, actorId, own, { action, actorId });
		if (e.length) windows.push({ responderId: actorId, moments: own, eligible: e, preview: { getemt: [], toWelloe: false, mpLoss: {} } });
	}
	if (!windows.length) return res;
	return { state: buildPendingReaction(state, actorId, action, windows), ok: true, success: true, reactionPending: true };
}
