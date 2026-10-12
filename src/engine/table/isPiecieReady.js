// isPiecieReady — the single readiness rule for a placed Piecie (Phase 57, E22).
// Ready = face-down, not yet activated, and the stored canActivateOnTurn has been reached.
// A missing canActivateOnTurn is NOT ready (fail closed); there is no playedOnTurn fallback.
export function isPiecieReady(entry, turnNumber) {
	if (!entry || entry.type !== 'PIECIE') return false;
	if (entry.faceDown !== true || entry.activated === true) return false;
	if (!Number.isFinite(entry.canActivateOnTurn)) return false;
	return turnNumber >= entry.canActivateOnTurn;
}
