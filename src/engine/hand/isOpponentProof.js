// isOpponentProof - true for a hand card an opponent's effect may never discard, take or set aside (D-06): a Personal Quest.
export function isOpponentProof(card) {
	return card?.type === 'PERSONAL_QUEST';
}
