// armSetAside - at the start of a player's turn, the cards set aside from their hand (Ronald's Strategic Insight)
// now count down: they return at the end of THIS turn. Mutates `state`.
export function armSetAside(state, playerId) {
	for (const entry of state.players[playerId]?.setAside || []) entry.armed = true;
	return state;
}
