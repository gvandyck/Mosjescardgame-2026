// resolvePendingChoice — answer state.pendingChoice with one of its options, then resume the paused
// trigger (with its saved ctx, so nothing is re-rolled) and the jobs that were waiting behind it.
import { runTriggerJobs } from './runTriggerJobs.js';

export function resolvePendingChoice(state, value) {
	const pc = state.pendingChoice;
	if (!pc) return { ok: false, success: false, state, error: 'No pending choice' };
	if (!pc.options.some(o => JSON.stringify(o) === JSON.stringify(value))) {
		return { ok: false, success: false, state, error: 'That is not one of the options' };
	}
	const s = JSON.parse(JSON.stringify(state));
	delete s.pendingChoice;
	const target = s.players[pc.playerId];
	target._pendingTargets = { ...(target._pendingTargets || {}), [pc.key]: value };
	const out = runTriggerJobs(s, pc.hook, pc.jobs, pc.jobIndex, pc.ctx, { key: pc.key, playerId: pc.playerId });
	const next = out.amount !== undefined && out.state ? out.state : out;
	return { ok: true, success: true, state: next };
}
