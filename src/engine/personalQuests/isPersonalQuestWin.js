// isPersonalQuestWin - does this roll meet the Personal Quest's need? need = { count, face, orHigher, anySame? }.
// anySame: some face shows at least `count` times. Otherwise `count` dice show `face` (or higher when orHigher).
export function isPersonalQuestWin(need, dice) {
	const rolled = Array.isArray(dice) ? dice : [];
	if (!need || !rolled.length) return false;
	const count = need.count ?? 1;
	if (need.anySame) {
		return [1, 2, 3, 4, 5, 6].some(f => rolled.filter(d => d === f).length >= count);
	}
	const hits = rolled.filter(d => (need.orHigher ? d >= need.face : d === need.face));
	return hits.length >= count;
}
