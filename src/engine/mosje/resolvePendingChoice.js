// resolvePendingChoice — answer state.pendingChoice with one of its options, then resume the paused
// trigger (with its saved ctx, so nothing is re-rolled) and the jobs that were waiting behind it.
// A Piecie pause (hook 'piecie') resumes the same activation; once it finishes, the after-activation
// reaction window opens as it would have without the pause.
import { runTriggerJobs } from './runTriggerJobs.js';
import { resumePiecieChoice } from '../piecies/resumePiecieChoice.js';
import { withReactionWindow } from '../reactions/withReactionWindow.js';

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
	if (pc.hook === 'piecie') {
		const type = pc.piecie?.free ? 'activatePiecieFree' : 'activatePiecie';
		const out = withReactionWindow(s, pc.actorId, { type }, (st) => ({ state: resumePiecieChoice(st, pc), success: true }));
		return { ok: true, success: true, state: out.state, reactionPending: out.reactionPending };
	}
	const out = runTriggerJobs(s, pc.hook, pc.jobs, pc.jobIndex, pc.ctx, { key: pc.key, playerId: pc.playerId });
	const next = out.amount !== undefined && out.state ? out.state : out;
	return { ok: true, success: true, state: next };
}
