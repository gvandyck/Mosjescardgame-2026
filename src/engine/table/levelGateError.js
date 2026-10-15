// levelGateError - "Needs: one of your Mosjes at Level 2+" (cardDef.levelGate). Error string or null.
export function levelGateError(state, playerId, cardDef) {
	const need = cardDef?.levelGate;
	if (!need) return null;
	const ok = (state.players[playerId]?.activeSlots || []).some(s => s && !s.isDefeated && (s.level ?? 1) >= need);
	return ok ? null : `Needs: one of your Mosjes at Level ${need}+`;
}
