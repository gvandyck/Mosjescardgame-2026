// snapBackTacticianSet — end of turn: every Mosje under a Tactician set goes back to its real MP plus the gains
// and losses of the turn (5-grid, 0-95). Never levels up or getemts. Mutates the passed (cloned) state.
import { roundToFive } from '../roundToFive.js';

export function snapBackTacticianSet(state) {
	for (const player of Object.values(state.players || {})) {
		for (const slot of player.activeSlots || []) {
			if (!slot?.tacticianSet) continue;
			const { realMp, delta } = slot.tacticianSet;
			delete slot.tacticianSet;
			if (slot.isDefeated) continue;
			slot.mp = roundToFive(Math.min(95, Math.max(0, realMp + delta))); // mp-direct-ok: Tactician snap-back
		}
	}
	return state;
}
