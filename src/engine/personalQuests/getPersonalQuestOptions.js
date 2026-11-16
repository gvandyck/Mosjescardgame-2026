// getPersonalQuestOptions - every Personal Quest in the player's hand x every own Mosje slot, with the engine's verdict
// from canAttemptPersonalQuest. Pure. Read by the bot and by the board, so neither can offer what the engine refuses.
// Returns [{ cardId, slotIndex, ok, error }] (error only when ok is false).
import { canAttemptPersonalQuest } from './canAttemptPersonalQuest.js';

export function getPersonalQuestOptions(state, playerId, { choiceFor } = {}) {
	const player = state?.players?.[playerId];
	if (!player) return [];
	const out = [];
	const seen = new Set();
	for (const card of player.hand || []) {
		if (card.type !== 'PERSONAL_QUEST' || seen.has(card.cardId)) continue;
		seen.add(card.cardId);
		(player.activeSlots || []).forEach((slot, slotIndex) => {
			if (!slot || slot.isDefeated) return;
			const choice = choiceFor ? choiceFor(state, playerId, card.cardId) : {};
			const r = canAttemptPersonalQuest(state, playerId, { cardId: card.cardId, slotIndex, choice });
			out.push(r.ok ? { cardId: card.cardId, slotIndex, ok: true } : { cardId: card.cardId, slotIndex, ok: false, error: r.error });
		});
	}
	return out;
}
