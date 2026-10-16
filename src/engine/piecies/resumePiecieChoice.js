// resumePiecieChoice - carries on a Piecie activation after its pause was answered. resolvePendingChoice has
// already stored the pick on the chooser's _pendingTargets[pc.key] and removed state.pendingChoice.
// Re-runs the effect with ctx.resume; if it pauses again the new pause is returned, otherwise the answered key
// is consumed and the post-effect half runs exactly once. Returns the new state.
import { runPiecieEffect } from './runPiecieEffect.js';
import { afterPiecieEffect } from './afterPiecieEffect.js';
import { continueDubbeleDing } from './continueDubbeleDing.js';
import { takeHeldMod } from '../reactions/takeHeldMod.js';
import { cancelHeldCard } from '../reactions/cancelHeldCard.js';
import { applyRetarget } from '../reactions/applyRetarget.js';
import { checkVictory } from '../victoryChecker.js';

export function resumePiecieChoice(state, pc) {
	const { cardDef, slotIndex, free, after, autoKeys } = pc.piecie;
	const cancel = takeHeldMod(state, 'cancel', pc.actorId); // Jensen! / Jammertje Gepakt!: the held Piecie never resolves
	if (cancel) {
		delete state.players[pc.playerId]?._pendingTargets?.[pc.key];
		return continueDubbeleDing(checkVictory(cancelHeldCard(state, pc.actorId, slotIndex, cancel.dest, cardDef)));
	}
	applyRetarget(state, pc);
	const ctx = { ...pc.ctx, slotIndex, free, resume: true };
	const run = runPiecieEffect(state, pc.actorId, cardDef, ctx, { after, autoKeys });
	if (run.paused) return run.state;
	delete run.state.players[pc.playerId]?._pendingTargets?.[pc.key];
	if (pc.piecie.copy) return run.state; // a copy is not an activation: no chains, no Place hooks
	const done = afterPiecieEffect(run.state, pc.actorId, slotIndex, cardDef, after || {}, { free }).state;
	return continueDubbeleDing(done); // Dubbele Ding: the next queued hand Piecie, if any
}
