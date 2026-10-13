// Martin, Senor West - holder text (While AZN Cless is also on your field): once per turn you may look at the top card
// of a Quest stack before attempting. Returns { success, state, cardId } - the only state change is the once-per-turn
// flag. The peeked id is for the acting player's client only (EFX-07 full in Phase 60); the human offer is added in
// the Quest flow (58-12).
import { isHolderTextActive } from '../../engine/synergy/isHolderTextActive.js';

export function senorWestPeekQuestStack(gameState, playerId, stackId) {
	const refuse = (error) => ({ success: false, state: gameState, cardId: null, error });
	if (gameState.activePlayerId !== playerId) return refuse('Only on your own turn');
	if (!isHolderTextActive(gameState, playerId, 'mosje_martin_senor_west')) return refuse('Senor West needs AZN Cless on the field');
	const player = gameState.players[playerId];
	if (player.westPeekTurn === gameState.turnNumber) return refuse('Already looked at a Quest stack this turn');
	const top = gameState.questStacks?.[stackId]?.deck?.[0];
	if (!top) return refuse('That Quest stack has no cards left');
	const state = JSON.parse(JSON.stringify(gameState));
	state.players[playerId].westPeekTurn = gameState.turnNumber;
	return { success: true, state, cardId: typeof top === 'object' ? top.cardId : top };
}
