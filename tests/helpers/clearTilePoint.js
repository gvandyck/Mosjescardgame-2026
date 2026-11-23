// clearTilePoint.js - a point on a board tile (relative to its box) where a press reaches the tile itself: clear of the state pills
// (Fresh, Protected, SKIPS TURN: a press reads their reason) and of the attachment chips (a press opens the Gear's detail, CC-19).
// Tries low-left first (the old fixed point), then other spots; falls back to low-left when nothing is clear.
const SPOTS = [[0.2, 0.6], [0.2, 0.45], [0.8, 0.45], [0.5, 0.3], [0.2, 0.88], [0.8, 0.88], [0.5, 0.5]];

/** @param {import('@playwright/test').Locator} tile @returns {Promise<{ x: number, y: number } | null>} null when the tile has no box */
export async function clearTilePoint(tile) {
	return tile.evaluate((el, spots) => {
		const box = el.getBoundingClientRect();
		if (!box.width || !box.height) return null;
		const at = ([fx, fy]) => ({ x: Math.round(box.width * fx), y: Math.round(box.height * fy) });
		for (const spot of spots) {
			const p = at(spot);
			const hit = document.elementFromPoint(box.left + p.x, box.top + p.y);
			if (hit && el.contains(hit) && !hit.closest('.chip, .tile-badge')) return p;
		}
		return at(spots[0]);
	}, SPOTS);
}
