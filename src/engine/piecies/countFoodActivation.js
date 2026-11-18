// countFoodActivation - after-activation step: a food Piecie raises player.foodActivatedThisTurn (paid or free).
export function countFoodActivation(state, { playerId, cardDef }) {
	if (cardDef?.tag !== 'food') return state;
	const player = state.players[playerId];
	player.foodActivatedThisTurn = (player.foodActivatedThisTurn || 0) + 1;
	return state;
}
