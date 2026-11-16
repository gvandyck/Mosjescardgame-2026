// reshufflePileIntoDeck - deck-out: the non-Mosje cards of the pile become the deck, fallen Mosjes stay in the pile.
// Returns how many cards moved. Mutates the already cloned player.
export function reshufflePileIntoDeck(player, shuffle) {
	const pile = player.graveyard || [];
	const moving = pile.filter(e => e?.type !== 'MOSJE');
	player.graveyard = pile.filter(e => e?.type === 'MOSJE');
	player.deck = shuffle(moving);
	return moving.length;
}
