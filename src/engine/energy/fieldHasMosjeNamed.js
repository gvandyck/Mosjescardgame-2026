// fieldHasMosjeNamed - true when the player has a live, non-sideways-agnostic Mosje whose name/id contains the word.
export function fieldHasMosjeNamed(state, playerId, word) {
	const w = String(word).toLowerCase();
	return (state.players?.[playerId]?.activeSlots || []).some(
		s => s && !s.isDefeated && `${s.name || ''} ${s.cardId || ''}`.toLowerCase().split(/[^a-z0-9]+/).includes(w),
	);
}
