// applyRetarget - Counter Strikka. Two shapes of entry (reactionMods kind 'retarget'):
//  - { key, value }: a Piecie's pre-chosen target (state._pendingTargets[key]); applyRetarget(state) swaps it before the replay.
//  - { to }: a paused pick (pc.key) swapped for the Mosje the Snelle player chose; applyRetarget(state, pc) in the resume.
// Mutates the cloned state.
import { takeHeldMod } from './takeHeldMod.js';

export function applyRetarget(state, pc = null) {
	if (!pc) {
		const rt = takeHeldMod(state, 'retarget', state.reactionMods?.find(m => m.kind === 'retarget' && m.key)?.playerId);
		if (rt?.key) state._pendingTargets = { ...(state._pendingTargets || {}), [rt.key]: rt.value };
		return;
	}
	const rt = takeHeldMod(state, 'retarget', pc.actorId);
	if (!rt?.to) return;
	const chooser = state.players[pc.playerId];
	chooser._pendingTargets = { ...(chooser._pendingTargets || {}), [pc.key]: rt.to };
}
