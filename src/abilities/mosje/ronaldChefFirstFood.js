// Ronald, The Master Chef - the first food Piecie you activate each turn gives 10 MP more (passive).
// "First" is read from player.foodActivatedThisTurn, raised after the effect by countFoodActivation, so a food card
// that gives no MP still uses the bonus up (D-10).
import { friendSlotsOnField } from '../../engine/friends/friendSlotsOnField.js';

export function ronaldChefFirstFood({ state, playerId }) {
	const player = state.players[playerId];
	if (!player || (player.foodActivatedThisTurn || 0) > 0) return 0;
	const hasChef = friendSlotsOnField(state, playerId, ['Ronald']).some(i => player.activeSlots[i].cardId === 'mosje_ronald_chef');
	return hasChef ? 10 : 0;
}
