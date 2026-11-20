// describeRollNeed - "Need 2x 4+" for the dice row of a Personal Quest result, from the card's roll data (72-04). '' when unknown.
export function describeRollNeed(roll) {
	const need = roll?.need;
	if (!need || !need.count || !need.face) return '';
	return `Need ${need.count}x ${need.face}${need.orHigher ? '+' : ''}`;
}
