// takeQuestDiceGrants - after the dice count of a roll: remove the grants that counted, and the bound grants whose Mosje is
// gone from its slot. Mutates the (already cloned) state it gets - never call it on the state of a dry run.
import { grantCountsFor } from './grantCountsFor.js';

export function takeQuestDiceGrants(state, playerId, slot) {
	const player = state.players[playerId];
	if (!player?.questDiceGrants?.length) return state;
	const slotIndex = player.activeSlots.indexOf(slot);
	const gone = (g) => Number.isInteger(g.slotIndex) && player.activeSlots[g.slotIndex]?.cardId !== g.cardId;
	player.questDiceGrants = player.questDiceGrants.filter(g => !grantCountsFor(g, slot, slotIndex) && !gone(g));
	return state;
}
