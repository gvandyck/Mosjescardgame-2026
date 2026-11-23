// personalQuestWinChance - chance that `diceCount` dice (1..6) meet a Personal Quest need { count, face, orHigher, anySame }.
// Exact: a binomial for "count dice at face (or higher)", and a face-count recursion for "any `count` the same". Pure.
const C = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };

// P(no face appears `count` or more times) over n dice: ways to spread n dice over 6 faces, each face < count times.
function noneReaches(n, count) {
	const ways = (dice, faces) => {
		if (faces === 0) return dice === 0 ? 1 : 0;
		let sum = 0;
		for (let k = 0; k < count && k <= dice; k++) sum += C(dice, k) * ways(dice - k, faces - 1);
		return sum;
	};
	return ways(n, 6) / 6 ** n;
}

export function personalQuestWinChance(need, diceCount) {
	const n = Math.min(6, Math.max(1, Math.floor(Number(diceCount) || 1)));
	const count = need?.count ?? 1;
	if (count > n) return 0;
	if (need?.anySame) return 1 - noneReaches(n, count);
	const p = (need?.orHigher ? 7 - need.face : 1) / 6;
	let chance = 0;
	for (let k = count; k <= n; k++) chance += C(n, k) * p ** k * (1 - p) ** (n - k);
	return chance;
}
