// discardUpkeepCard - an Upkeep card that was not paid goes to its owner's pile (from the Piecie slot or off its Mosje).
// item = { where: 'piecie' | 'attachment', slotIndex, attachIndex?, cardId }. Mutates the (already cloned) state.
import { toGraveyardEntry } from '../graveyardUtils.js';
import { dropTiedEffects } from './dropTiedEffects.js';

export function discardUpkeepCard(state, playerId, item) {
	const player = state.players[playerId];
	if (item.where === 'piecie') {
		if (player.piecieSlots[item.slotIndex]?.cardId !== item.cardId) return state;
		player.piecieSlots[item.slotIndex] = null;
	} else {
		const slot = player.activeSlots[item.slotIndex];
		const i = (slot?.attachments || []).findIndex(a => a.cardId === item.cardId);
		if (i < 0) return state;
		slot.attachments = slot.attachments.filter((_, k) => k !== i);
		dropTiedEffects(state, { playerId, slotIndex: item.slotIndex, attachmentCardId: item.cardId });
	}
	player.graveyard = [...(player.graveyard || []), toGraveyardEntry(item.cardId, 'discarded')];
	return state;
}
