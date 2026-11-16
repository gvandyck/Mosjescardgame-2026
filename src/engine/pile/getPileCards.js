// getPileCards - the discarded cards in a player's one pile (everything that is not a fallen Mosje), order kept.
export function getPileCards(player) {
	return (player?.graveyard || []).filter(e => e?.type !== 'MOSJE');
}
