// reorderDeckTop — Debug System: new top[i] = old top[order[i]]. Invalid permutation -> unchanged.
export function reorderDeckTop(state, deckOwnerId, order, n = 5) {
	const deck = state.players[deckOwnerId]?.deck;
	if (!deck || !Array.isArray(order)) return state;
	const k = Math.min(n, deck.length);
	const valid = order.length === k && [...order].sort((a, b) => a - b).every((v, i) => v === i);
	if (!valid) return state;
	const s = JSON.parse(JSON.stringify(state));
	const top = s.players[deckOwnerId].deck.slice(0, k);
	s.players[deckOwnerId].deck.splice(0, k, ...order.map(i => top[i]));
	return s;
}
