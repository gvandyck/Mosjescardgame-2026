// buildWelloePile.js — the Welloe pile button at the right end of a row (63-UI-SPEC, D-13).
// Only exists while the pile has cards (empty string otherwise): a dark violet back, the word WELLOE and a count badge.
export function buildWelloePile({ count } = {}) {
	const n = Math.trunc(Number(count));
	if (!Number.isFinite(n) || n < 1) return '';
	return `<button type="button" class="welloe-pile" data-pile="welloe" data-count="${n}" data-slot-kind="pile" aria-label="Welloe pile, ${n} ${n === 1 ? 'card' : 'cards'}"><span class="welloe-pile__word">WELLOE</span><span class="welloe-pile__count">${n}</span></button>`;
}
