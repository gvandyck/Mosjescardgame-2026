// FPS West — Tactical Analysis (activated half): once per turn, pay 1 Energy (useMosjeAbility): look at the
// opponent's hand and name the card type they will play next. The guess is stored on FPS West's slot and
// settled by fpsWestTacticalAnalysis.js. Input: state._pendingTargets.card_type (MOSJE / PIECIE / SNELLE / PLACE).
const TYPES = ['MOSJE', 'PIECIE', 'SNELLE', 'PLACE'];

export function fpsWestGuess(gameState, playerId, mosjeId = 'mosje_fps_west') {
	const state = JSON.parse(JSON.stringify(gameState));
	const slot = state.players[playerId]?.activeSlots.find(s => s && !s.isDefeated && s.cardId === mosjeId);
	if (!slot) throw new Error('FPS West is not on the field');
	const guess = state._pendingTargets?.card_type;
	if (!TYPES.includes(guess)) throw new Error('Name a card type: Mosje, Piecie, Snelle or Place');
	slot.fpsWestGuess = guess;
	state.revealedHandTo = { viewerId: playerId, turnNumber: state.turnNumber }; // UI shows the opponent's hand to this player only
	return state;
}
