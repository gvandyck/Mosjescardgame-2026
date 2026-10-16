// welloePileOptions - one pick option per distinct Mosje in the player's Welloe pile.
export function welloePileOptions(player) {
	const seen = new Set();
	return (player.welloePile || []).filter(e => e.type === 'MOSJE' && !seen.has(e.cardId) && seen.add(e.cardId))
		.map(e => ({ label: e.name, cardId: e.cardId }));
}
