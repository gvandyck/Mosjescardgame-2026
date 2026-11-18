// Kladje (piecie_energy_surge) Discarded hook: "Discarded: draw 2" for the card's owner. Mutates the state in place
// (callers of a hand discard keep their player references) and draws nothing from an empty deck.
export function kladjeDiscarded(state, ctx) {
	const player = state.players[ctx.ownerId];
	const n = Math.min(2, player?.deck?.length || 0);
	if (!n) return state;
	player.hand.push(...player.deck.splice(0, n));
	player.drawsThisTurn = (player.drawsThisTurn || 0) + n;
	player.cardsDrawnThisTurn = (player.cardsDrawnThisTurn || 0) + n;
	return state;
}
