// getAttachmentChips.js — attachment rows as chip specs for buildChipRowHtml (72-05, D-05). Attach order is kept.
export function getAttachmentChips(rows) {
	return (Array.isArray(rows) ? rows : []).map(({ cardId, name, kind }) => ({
		label: name,
		kind,
		title: name,
		interactive: true,
		data: { 'card-id': cardId },
	}));
}
