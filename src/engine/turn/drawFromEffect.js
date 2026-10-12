// drawFromEffect — the one draw for card/Quest effects. Empty deck: draws nothing, no reshuffle, no cooldown (2026-10-11 ruling).
export function drawFromEffect(state, playerId, count = 1) {
	const s = JSON.parse(JSON.stringify(state));
	const player = s.players[playerId];
	const n = Math.min(count, player.deck.length);
	if (n > 0) {
		player.hand.push(...player.deck.splice(0, n));
		player.drawsThisTurn = (player.drawsThisTurn || 0) + n;
		player.cardsDrawnThisTurn = (player.cardsDrawnThisTurn || 0) + n;
	}
	return s;
}
