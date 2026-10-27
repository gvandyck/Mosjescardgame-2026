// countQuestAttempt — display-only per-player Quest counter for the game-over screen (64-05, D-19).
// Works on the already cloned state that resolveQuestAttempt owns: sets players[playerId].questStats and returns the state.
// No rule, MP, cost or Quest outcome ever reads questStats.
export function countQuestAttempt(state, playerId, win) {
	const player = state.players?.[playerId];
	if (!player) return state;
	const prev = player.questStats || { attempted: 0, won: 0 };
	player.questStats = { attempted: prev.attempted + 1, won: prev.won + (win ? 1 : 0) };
	return state;
}
