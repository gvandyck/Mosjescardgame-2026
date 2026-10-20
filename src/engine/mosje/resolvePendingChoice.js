// resolvePendingChoice — answer state.pendingChoice with one of its options, then resume the paused
// trigger (with its saved ctx, so nothing is re-rolled) and the jobs that were waiting behind it.
// A Piecie pause (hook 'piecie') resumes the same activation; once it finishes, the after-activation
// reaction window opens as it would have without the pause.
import { runTriggerJobs } from './runTriggerJobs.js';
import { resumePiecieChoice } from '../piecies/resumePiecieChoice.js';
import { resumeSnelleChoice } from '../snelle/resumeSnelleChoice.js';
import { continueReaction } from '../reactions/resolveReaction.js';
import { withReactionWindow } from '../reactions/withReactionWindow.js';
import { checkVictory } from '../victoryChecker.js';

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
		// A copy (Gevalletje Klakkeloos) is not an activation: no reaction window.
		if (pc.piecie?.copy) return { ok: true, success: true, state: resumePiecieChoice(s, pc) };
		// The resume itself is the held action, so a Jensen! / Counter Strikka / Dubbele Temminks can still act on it.
		const out = withReactionWindow(s, pc.actorId, { type: 'resumePiecie', args: [pc] }, (st) => ({ state: resumePiecieChoice(st, pc), success: true }));
		return { ok: true, success: true, state: out.state, reactionPending: out.reactionPending };
	}
	if (pc.hook === 'snelle') {
		// A Snelle pick resumes the same play; inside a reaction window the other windows and the held action follow.
		if (pc.after) {
			const run = resumeSnelleChoice(s, pc);
			if (run.paused) return { ok: true, success: true, state: run.state };
			const res = continueReaction(run.state, pc.after.p, pc.after.queue);
			return { ...res, ok: res.ok ?? res.success, success: res.success ?? res.ok, reactionPending: !!res.state?.pendingReaction };
		}
		const out = withReactionWindow(s, pc.actorId, { type: 'resumeSnelle', args: [pc] }, (st) => {
			const run = resumeSnelleChoice(st, pc);
			return { state: run.state, success: true, paused: run.paused };
		});
		return { ok: true, success: true, state: out.state, reactionPending: out.reactionPending };
	}
	const out = runTriggerJobs(s, pc.hook, pc.jobs, pc.jobIndex, pc.ctx, { key: pc.key, playerId: pc.playerId });
	const next = out.amount !== undefined && out.state ? out.state : out;
	// A resumed trigger job (for example Jisca's Perfect Combo) can flag a getemt-while-sideways Mosje (_pendingWelloe).
	// Every other engine entry point sweeps it with checkVictory; this one did not, so the flag lingered until a later
	// action (61.1-02, seed 50349). No sweep while another pause is open: that resume sweeps in turn.
	return { ok: true, success: true, state: next.pendingChoice ? next : checkVictory(next) };
}
