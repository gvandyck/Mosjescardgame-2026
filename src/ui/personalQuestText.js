// personalQuestText.js — the printed Needs / Pay / Roll lines of a Personal Quest as one plain string.
// Phase 69 stopgap for the plain fallback face; Phase 72 draws the real card face.
export function personalQuestText(card) {
	const parts = [];
	if (card?.needsText) parts.push(`Needs: ${card.needsText}`);
	if (card?.payText) parts.push(`Pay: ${card.payText}`);
	if (card?.rollText) parts.push(`Roll: ${card.rollText}`);
	return parts.join(' ');
}
