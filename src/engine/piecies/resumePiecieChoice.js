// resumePiecieChoice - carries on a Piecie activation after its pause was answered. resolvePendingChoice has
// already stored the pick on the chooser's _pendingTargets[pc.key] and removed state.pendingChoice.
// Re-runs the effect with ctx.resume; if it pauses again the new pause is returned, otherwise the answered key
// is consumed and the post-effect half runs exactly once. Returns the new state.
import { runPiecieEffect } from './runPiecieEffect.js';
import { afterPiecieEffect } from './afterPiecieEffect.js';

export function resumePiecieChoice(state, pc) {
	const { cardDef, slotIndex, free, after, autoKeys } = pc.piecie;
	const ctx = { ...pc.ctx, slotIndex, free, resume: true };
	const run = runPiecieEffect(state, pc.actorId, cardDef, ctx, { after, autoKeys });
	if (run.paused) return run.state;
	delete run.state.players[pc.playerId]?._pendingTargets?.[pc.key];
	return afterPiecieEffect(run.state, pc.actorId, slotIndex, cardDef, after || {}, { free }).state;
}
