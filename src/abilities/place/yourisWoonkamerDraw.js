// Youri's Woonkamer - once per turn, when a player with a Youri activates a Piecie on the turn they placed it: draw 1.
// After-activation step; ctx.placedThisTurn comes from the pre-effect snapshot in resolvePiecieActivation.
import { friendSlotsOnField } from '../../engine/friends/friendSlotsOnField.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';

export function yourisWoonkamerDraw(state, { playerId, placedThisTurn }) {
	if (state.activePlace !== 'place_youris_woonkamer' || placedThisTurn !== true) return state;
	const player = state.players[playerId];
	if (player.yourisWoonkamerTurn === state.turnNumber) return state;
	if (!friendSlotsOnField(state, playerId, ['Youri']).length) return state;
	const next = drawFromEffect(state, playerId, 1);
	next.players[playerId].yourisWoonkamerTurn = state.turnNumber;
	return next;
}
