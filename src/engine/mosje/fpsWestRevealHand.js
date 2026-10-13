// fpsWestRevealHand — FPS West holder text: once per turn (own turn, free) make the opponent reveal their hand.
// Live only through isHolderTextActive (FPS Coert on the field, or Synergy Chamber). Sets state.revealedHandTo so
// the UI shows the hand to this player only. Returns { ok, success, state, error? }.
import { isHolderTextActive } from '../synergy/isHolderTextActive.js';
import { canMosjeAct } from '../mp/canMosjeAct.js';

export function fpsWestRevealHand(gameState, playerId) {
	const fail = (error) => ({ ok: false, success: false, state: gameState, error });
	const player = gameState.players[playerId];
	if (!player) return fail('Player not found');
	if (gameState.activePlayerId !== playerId) return fail('Only on your own turn');
	const west = player.activeSlots.find(s => s && !s.isDefeated && s.cardId === 'mosje_fps_west');
	if (!west || !canMosjeAct(west) || !isHolderTextActive(gameState, playerId, 'mosje_fps_west')) return fail('FPS West holder text is not active');
	if (player.handRevealTurn === gameState.turnNumber) return fail('Already used this turn');
	const state = JSON.parse(JSON.stringify(gameState));
	state.players[playerId].handRevealTurn = state.turnNumber;
	state.revealedHandTo = { viewerId: playerId, turnNumber: state.turnNumber };
	return { ok: true, success: true, state };
}
