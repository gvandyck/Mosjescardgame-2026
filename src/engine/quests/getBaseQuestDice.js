// getBaseQuestDice — one die per star of the Quest's rollTrait ('best' = highest, 'none' = 1), min 1.
export function getBaseQuestDice(slot, quest) {
	if (!quest || quest.rollTrait === 'none' || quest.band === 'trained') return 1;
	const traits = slot?.traits || {};
	const n = quest.rollTrait === 'best'
		? Math.max(0, ...Object.values(traits).map(Number))
		: Number(traits[quest.rollTrait]) || 0;
	return Math.max(1, n);
}
