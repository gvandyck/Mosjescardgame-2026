// Ronnie's Kitchen - with a Ronald on your field, draw 1 the first time you activate a food Piecie each turn.
// After-activation step: runs before countFoodActivation raises the counter.
import { friendSlotsOnField } from '../../engine/friends/friendSlotsOnField.js';
import { drawFromEffect } from '../../engine/turn/drawFromEffect.js';

export function ronniesKitchenDraw(state, { playerId, cardDef }) {
	if (state.activePlace !== 'place_ronnies_kitchen' || cardDef?.tag !== 'food') return state;
	if ((state.players[playerId].foodActivatedThisTurn || 0) > 0) return state;
	if (!friendSlotsOnField(state, playerId, ['Ronald']).length) return state;
	return drawFromEffect(state, playerId, 1);
}
