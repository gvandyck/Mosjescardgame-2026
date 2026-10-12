// removeDiscardsFromGame — Parkeren Delft: up to `max` picked discard cards leave the game (state.removedFromGame).
export function removeDiscardsFromGame(state, picks, max = 3) {
	const s = JSON.parse(JSON.stringify(state));
	s.removedFromGame = s.removedFromGame || [];
	const seen = new Set();
	const valid = (picks || []).filter(p => {
		const key = `${p?.playerId}:${p?.graveyardIndex}`;
		if (seen.has(key) || !s.players[p?.playerId]?.graveyard?.[p.graveyardIndex]) return false;
		seen.add(key);
		return true;
	}).slice(0, max);
	valid.sort((a, b) => b.graveyardIndex - a.graveyardIndex);
	for (const p of valid) s.removedFromGame.push(s.players[p.playerId].graveyard.splice(p.graveyardIndex, 1)[0]);
	return s;
}
