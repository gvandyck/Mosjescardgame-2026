// roundToTen — nearest multiple of 10 (non-finite -> 0). Used for Power.
export function roundToTen(n) {
	const v = Number(n);
	return Number.isFinite(v) ? Math.round(v / 10) * 10 : 0;
}
