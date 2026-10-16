// resumeSnelleChoice - carries on a Snelle play after its pick was answered (resolvePendingChoice already stored the pick
// on the chooser's _pendingTargets[pc.key] and removed state.pendingChoice). Returns { state, paused }.
import { runSnelleEffect } from './runSnelleEffect.js';
import { finishSnelle } from './finishSnelle.js';

export function resumeSnelleChoice(state, pc) {
	const { cardDef, cardId } = pc.snelle;
	const run = runSnelleEffect(state, pc.actorId, cardDef, { ...pc.ctx, resume: true }, cardId);
	if (run.paused) { run.state.pendingChoice.after = pc.after; return run; }
	delete run.state.players[pc.playerId]?._pendingTargets?.[pc.key];
	return { state: finishSnelle(run.state, pc.actorId, cardDef, cardId), paused: false };
}
