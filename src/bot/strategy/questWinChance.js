// questWinChance — exact binomial win chance of a Quest band when rolling `diceCount` d6.
import { QUEST_NEEDS } from './questNeeds.js';

export function questWinChance(band, diceCount, ease = 0) { // ease: successes needed less (Zwoele Ming Power), never fewer than 1
	if (band === 'trained') return 1;
	const need = QUEST_NEEDS[band];
	if (!need) return 0;
	const p = (7 - need.min) / 6;
	const needCount = Math.max(1, need.count - (ease | 0));
	const n = Math.max(1, diceCount | 0);
	let total = 0;
	let coef = 1; // C(n, k), built up as k grows
	for (let k = 0; k <= n; k++) {
		if (k > 0) coef = (coef * (n - k + 1)) / k;
		if (k >= needCount) total += coef * p ** k * (1 - p) ** (n - k);
	}
	return total;
}
