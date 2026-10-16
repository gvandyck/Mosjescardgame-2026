// resumeSnelleChoice - carries on a Snelle play after its pick was answered (resolvePendingChoice already stored the pick
// on the chooser's _pendingTargets[pc.key] and removed state.pendingChoice). Returns { state, paused }.
import { runSnelleEffect } from './runSnelleEffect.js';
import { finishSnelle } from './finishSnelle.js';
import { takeHeldMod } from '../reactions/takeHeldMod.js';
import { cancelHeldCard } from '../reactions/cancelHeldCard.js';
import { applyRetarget } from '../reactions/applyRetarget.js';

export function resumeSnelleChoice(state, pc) {
	const { cardDef, cardId } = pc.snelle;
	const cancel = takeHeldMod(state, 'cancel', pc.actorId);
	if (cancel) {
		delete state.players[pc.playerId]?._pendingTargets?.[pc.key];
		const idx = state.players[pc.actorId].piecieSlots.findIndex(s => s?.cardId === cardId && s?.type === 'SNELLE_PIECIE');
		return { state: cancelHeldCard(state, pc.actorId, idx, cancel.dest, cardDef), paused: false };
	}
	applyRetarget(state, pc);
	const run = runSnelleEffect(state, pc.actorId, cardDef, { ...pc.ctx, resume: true }, cardId);
	if (run.paused) { run.state.pendingChoice.after = pc.after; return run; }
	delete run.state.players[pc.playerId]?._pendingTargets?.[pc.key];
	return { state: finishSnelle(run.state, pc.actorId, cardDef, cardId), paused: false };
}
