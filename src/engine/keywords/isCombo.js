// isCombo - Combo = "the 2nd Piecie you activate this turn". piecieActivationsThisTurn is raised after an effect, for paid
// and free activations, so while the 2nd Piecie's effect runs it is exactly 1.
export function isCombo(state, playerId) {
	return state?.players?.[playerId]?.piecieActivationsThisTurn === 1;
}
