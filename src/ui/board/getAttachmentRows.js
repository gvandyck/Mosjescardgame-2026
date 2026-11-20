// getAttachmentRows.js — a Mosje slot's attachments as readable rows (72-05, D-05, D-06).
// Returns { rows: [{ cardId, name, text, kind }], count, max }. Never throws on an unknown card id.
import { getCardById } from '../../data/cardIndex.js';
import { getMaxAttachments } from '../../engine/attachments/getMaxAttachments.js';

function kindOf(card) {
	if (!card) return 'neutral';
	if (card.tag === 'gear') return 'gear';
	if (card.tag === 'pet') return 'pet';
	if (card.id === 'snelle_the_protector') return 'protector';
	return 'neutral';
}

export function getAttachmentRows(slot) {
	const list = Array.isArray(slot?.attachments) ? slot.attachments : [];
	const rows = list.map(({ cardId }) => {
		const card = getCardById(cardId);
		return {
			cardId,
			name: card?.name ?? String(cardId),
			text: card?.description ?? '',
			kind: kindOf(card),
		};
	});
	return { rows, count: rows.length, max: getMaxAttachments(slot) };
}
