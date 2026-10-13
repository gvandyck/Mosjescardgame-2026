// returnSetAside - at the end of a player's turn, armed set-aside cards go back to their hand. Mutates `state`.
export function returnSetAside(state, playerId) {
	const player = state.players[playerId];
	if (!Array.isArray(player?.setAside) || !player.setAside.length) return state;
	const back = player.setAside.filter(e => e.armed);
	player.setAside = player.setAside.filter(e => !e.armed);
	player.hand.push(...back.map(e => e.card));
	if (!player.setAside.length) delete player.setAside;
	return state;
}
