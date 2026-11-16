// takeMosjeFromPile - removes the first fallen Mosje with this card id from the pile and returns it, or null.
export function takeMosjeFromPile(player, mosjeCardId) {
	const pile = player?.graveyard || [];
	const at = pile.findIndex(e => e?.type === 'MOSJE' && e.cardId === mosjeCardId);
	return at < 0 ? null : pile.splice(at, 1)[0];
}
