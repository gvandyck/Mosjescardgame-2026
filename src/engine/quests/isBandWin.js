// isBandWin — does this dice result win the band's need? (Trained never rolls.)
const NEEDS = {
	steady: { count: 1, min: 4 },
	skilled: { count: 2, min: 4 },
	heroic: { count: 2, min: 5 },
	prepared: { count: 1, min: 4 },
	gated: { count: 1, min: 4 },
	coin_flip: { count: 1, min: 4 },
};

// ease (Zwoele Ming Power): successes needed less, never fewer than 1 (rules 13).
export function isBandWin(band, dice, ease = 0) {
	if (band === 'trained') return true;
	const need = NEEDS[band];
	if (!need) return false;
	return (dice || []).filter(d => d >= need.min).length >= Math.max(1, need.count - ease);
}
