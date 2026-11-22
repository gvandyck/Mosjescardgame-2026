// clampToViewport.js - Phase 72.1-09 (D-04): pure. The left edge (px) of an element of `width` centred on `centreX`, moved so it
// stays inside [margin, viewport - margin]. Wider than that: left = margin (the caller shrinks it).
export function clampToViewport({ centreX, width, viewport, margin = 8 }) {
	const max = viewport - width - margin;
	if (max < margin) return margin;
	return Math.min(Math.max(centreX - width / 2, margin), max);
}
