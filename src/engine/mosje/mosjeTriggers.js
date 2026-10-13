// MOSJE_TRIGGERS — push-only registry of 2.0 Mosje trigger hooks (like ATTACK_TRIGGERS).
// Entry: { mosjeId, run(state, ctx), available?(state, playerId) } (see runMosjeTriggers).
// startOfTurn/endOfTurn/questSuccess/piecieActivated/placeDestroyed/cardPlayedFromHand return state
// (or { needChoice }); questWinAmount returns the running number; oppStartOfTurn runs for the
// NON-active player's field; drawStep entries use available() to offer a draw-step option.
export const MOSJE_TRIGGERS = {
	startOfTurn: [],
	oppStartOfTurn: [],
	endOfTurn: [],
	questWinAmount: [],
	questSuccess: [],
	piecieActivated: [],
	placeDestroyed: [],
	cardPlayedFromHand: [],
	drawStep: [],
};
