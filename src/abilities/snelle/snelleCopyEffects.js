// snelleCopyEffects - Dubbele Temminks and Gevalletje Klakkeloos (Card List 2.0, Phase 60). They only queue a one-shot
// reactionMods entry; the held Piecie then replays (runPiecieEffect reads 'double', resolveReaction reads 'copy').
// Neither works on a five-star Piecie (snelleConditions), and a copy is not an activation (no chain, no Place hook).
import { addReactionMod } from '../../engine/reactions/addReactionMod.js';

const clone = (s) => JSON.parse(JSON.stringify(s));

// Dubbele Temminks: the Piecie you just activated happens a second time (same or new targets).
export function effect_snelle_dubbele_temminks(gameState, pid) {
	const state = clone(gameState);
	addReactionMod(state, { kind: 'double', playerId: pid, slotIndex: null });
	return state;
}

// Gevalletje Klakkeloos: the opponent's just-activated Piecie also happens for you, with your own targets.
export function effect_snelle_gevalletje_klakkeloos(gameState, pid) {
	const state = clone(gameState);
	addReactionMod(state, { kind: 'copy', playerId: pid, slotIndex: null });
	return state;
}
