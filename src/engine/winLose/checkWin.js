// checkWin — Obby 2.0 §2b: a player who STARTS their turn with a Mosje at Level 3
// (reached on an earlier turn and still there) wins. Mutates the passed (cloned) state.
export function checkWin(state, playerId) {
	const player = state.players?.[playerId];
	if (!player || state.status === 'FINISHED') return state;
	const holder = (player.activeSlots || []).find((s) => s && !s.isDefeated && s.level === 3);
	if (!holder) return state;
	state.status = 'FINISHED';
	state.winnerId = playerId;
	state.winReason = 'LEVEL_3';
	console.log(`[ENGINE] 🏆 ${player.name || playerId} held Level 3 — wins`);
	return state;
}
