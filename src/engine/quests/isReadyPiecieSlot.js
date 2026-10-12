// isReadyPiecieSlot — kept for callers; delegates to the single readiness rule.
import { isPiecieReady } from '../table/isPiecieReady.js';
export function isReadyPiecieSlot(entry, turnNumber) {
	return isPiecieReady(entry, turnNumber);
}
