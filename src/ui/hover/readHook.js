// readHook.js - a live number from a field card's data-cv1-<hook> attribute (null when the card has no such hook).
// Moved out of hoverZoom.js (72.1-06) so the hover dock and the phone card sheet read the tile the same way.
export function readHook(srcEl, hook) {
	const raw = srcEl.querySelector(`[data-cv1-${hook}]`)?.getAttribute(`data-cv1-${hook}`);
	return raw == null || raw === '' || !Number.isFinite(Number(raw)) ? null : Number(raw);
}
