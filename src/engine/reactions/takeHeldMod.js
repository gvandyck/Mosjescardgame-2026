// takeHeldMod - takeReactionMod, but only while the HELD action replays (state.replayingHeld, set by resolveReaction).
// Keeps a Snelle played inside the window (Frenssen! over a Jensen!) from consuming the entries meant for the held card.
import { takeReactionMod } from './takeReactionMod.js';

export function takeHeldMod(state, kind, playerId, slotIndex = null) {
	return state?.replayingHeld ? takeReactionMod(state, kind, playerId, slotIndex) : null;
}
