// callMosjeBackToWelloe - Call of the Welloes left play: its linked Mosje goes back to the Welloe pile.
export function callMosjeBackToWelloe(state, playerId, entry) {
	if (entry?.cardId !== 'piecie_call_of_welloes' || !entry.linkedMosjeCardId) return state;
	const p = state.players[playerId];
	const at = (p.activeSlots || []).findIndex(s => s && !s.isDefeated && s.cardId === entry.linkedMosjeCardId
		&& s.summonedByPiecie === 'piecie_call_of_welloes');
	if (at < 0) return state;
	const mosje = p.activeSlots[at];
	const activeSlots = p.activeSlots.slice();
	activeSlots[at] = null;
	const welloePile = [...(p.welloePile || []), { ...mosje, isDefeated: true, type: 'MOSJE', source: 'welloe' }];
	return { ...state, players: { ...state.players, [playerId]: { ...p, activeSlots, welloePile } } };
}
