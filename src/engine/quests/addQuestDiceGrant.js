// addQuestDiceGrant - a die bonus (or malus, negative) for a later Quest or Personal Quest roll of this player.
// grant: { amount, lasts: 'thisTurn' (default) | 'untilUsed', slotIndex?, cardId? (bound to that Mosje), friendAmount?: { friends, amount }, sourceCardId? }.
// Mutates the (already cloned) state it gets.
export function addQuestDiceGrant(state, playerId, grant) {
	const player = state.players[playerId];
	player.questDiceGrants = [...(player.questDiceGrants || []), { lasts: 'thisTurn', ...grant }];
	return state;
}
