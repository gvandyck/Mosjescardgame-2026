// getPileMosjes - the fallen Mosjes in a player's one pile (entries with type 'MOSJE'), order kept.
export function getPileMosjes(player) {
	return (player?.graveyard || []).filter(e => e?.type === 'MOSJE');
}
