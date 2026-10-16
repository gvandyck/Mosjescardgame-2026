// getSnelleCost - the Energy a Snelle costs right now. Blensen! is free after any Jensen! / Frenssen! this turn, else 4.
export function getSnelleCost(state, playerId, def) {
	if (def?.id === 'snelle_blensen') return state?.jensenPlayedTurn === state?.turnNumber ? 0 : 4;
	return Number(def?.cost) || 0;
}
