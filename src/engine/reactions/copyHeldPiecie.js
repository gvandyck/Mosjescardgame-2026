// copyHeldPiecie - Gevalletje Klakkeloos: the copier gets the held Piecie's effect with their own picks. A copy is not
// an activation: no chain roll, no on-activate Place, no triggers (a pick pauses with piecie.copy = true).
import { runPiecieEffect } from '../piecies/runPiecieEffect.js';

export function copyHeldPiecie(state, copierId, cardDef) {
	const next = JSON.parse(JSON.stringify(state));
	return runPiecieEffect(next, copierId, cardDef, { slotIndex: -1, free: true }, { copy: true }).state;
}
