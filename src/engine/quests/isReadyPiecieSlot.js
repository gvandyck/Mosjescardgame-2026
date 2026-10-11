// isReadyPiecieSlot — a face-down Piecie that may be activated this turn (Phase 57 formalises readiness).
// Same readiness test as activatePiecie: canActivateOnTurn, else the turn after it was played.
export function isReadyPiecieSlot(entry, turnNumber) {
	if (!entry || entry.faceDown !== true) return false;
	const from = Number.isFinite(entry.canActivateOnTurn)
		? entry.canActivateOnTurn
		: (Number.isFinite(entry.playedOnTurn) ? entry.playedOnTurn + 1 : Infinity);
	return from <= turnNumber;
}
