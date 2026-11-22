// getCardTypeLabel.js - the short type line of the card sheet ("Mosje", "Piecie", "Snelle", "Place", "Quest", "Personal Quest") (72.1-06).
export function getCardTypeLabel(card) {
	const type = String(card?.type || card?.cardType || '').toUpperCase();
	if (type === 'MOSJE') return 'Mosje';
	if (type === 'PIECIE') return 'Piecie';
	if (type === 'SNELLE_PIECIE') return 'Snelle';
	if (type === 'PLACE') return 'Place';
	if (type === 'PERSONAL_QUEST') return 'Personal Quest';
	if (type.startsWith('QUEST')) return 'Quest';
	return 'Card';
}
