// Headset: "Needs: a Digital Mosje. Look at the top 2 cards of your opponent's deck. With an FPS Mosje on your field:
// it gets +10 Power this turn." The look is recorded for the activator only (revealCards) and the deck order is not
// changed. With FPS Coert and FPS West both on the field the player picks which gets the Power (D-30).
import { cloneState } from '../cloneState.js';
import { addPowerThisTurn } from '../addPowerThisTurn.js';
import { revealCards } from '../../../engine/hidden/revealCards.js';
import { pickFriendOnField } from '../../../engine/friends/pickFriendOnField.js';

export function effect_headset(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	if (!ctx.headsetSeen) {
		const oppId = Object.keys(state.players).find(id => id !== playerId);
		const top = (state.players[oppId]?.deck || []).slice(0, 2).map(c => c.cardId);
		if (top.length) revealCards(state, playerId, 'piecie_headset', top);
	}
	const friend = pickFriendOnField(state, playerId, ['FPS'], 'headset_friend', 'Which FPS Mosje gets +10 Power this turn?');
	if (friend.needChoice) return { state, needChoice: { ...friend.needChoice, ctx: { headsetSeen: true } } };
	if (!friend.none) addPowerThisTurn(state, playerId, friend.slotIndex, 10);
	return state;
}
