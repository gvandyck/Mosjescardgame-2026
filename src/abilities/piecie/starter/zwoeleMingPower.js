// Zwoele Ming Power: "Your next Quest this turn (not a Personal Quest) needs 1 success less. A Ming also gains 10 MP."
// The ease sits on the player (questEaseThisTurn); rollCore moves it onto the held roll (pending.ease) and zeroes it.
// With two Mings the player picks which one gains (pickFriendOnField).
import { cloneState } from '../cloneState.js';
import { gainFromPiecie } from '../gainFromPiecie.js';
import { pieceDef } from '../pieceDef.js';
import { pickFriendOnField } from '../../../engine/friends/pickFriendOnField.js';

export function effect_zwoele_ming_power(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	if (!ctx.easeGiven) player.questEaseThisTurn = (player.questEaseThisTurn || 0) + 1;
	const friend = pickFriendOnField(state, playerId, ['Ming'], 'zwoele_ming_friend', 'Which Ming gains 10 MP?');
	if (friend.needChoice) return { state, needChoice: { ...friend.needChoice, ctx: { easeGiven: true } } };
	if (friend.none) return state;
	return gainFromPiecie(state, playerId, friend.slotIndex, 10, pieceDef('piecie_zwoele_ming_power'));
}
