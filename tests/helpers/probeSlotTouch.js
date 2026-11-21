// probeSlotTouch.js - Phase 65-07 (D-15): is the marked slot a real touch target? Probes document.elementFromPoint at the slot centre,
// 20 px beside the label (inside the slot) and at the slot's four corners and four edge middles, each inset 8 px, and lists every
// point where the topmost element is NOT the slot or one of its descendants. [] means a finger lands on the slot anywhere.
// Nothing is changed on the page (no pointer-events trick here: the slot itself must answer, which fails while it is inert).

/** @param {import('@playwright/test').Page} page @returns {Promise<Array<{ point: string, x: number, y: number, top: string }>>} */
export async function probeSlotTouch(page) {
	return page.evaluate(() => {
		const slot = document.querySelector('[data-place-here]');
		if (!slot) return [{ point: 'no marked slot', x: 0, y: 0, top: 'none' }];
		const r = slot.getBoundingClientRect();
		const label = slot.querySelector('[data-place-here-label]')?.getBoundingClientRect();
		const inset = 8;
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		const points = {
			centre: [cx, cy],
			'top-left': [r.left + inset, r.top + inset],
			'top-right': [r.right - inset, r.top + inset],
			'bottom-left': [r.left + inset, r.bottom - inset],
			'bottom-right': [r.right - inset, r.bottom - inset],
			'top-middle': [cx, r.top + inset],
			'bottom-middle': [cx, r.bottom - inset],
			'left-middle': [r.left + inset, cy],
			'right-middle': [r.right - inset, cy],
		};
		if (label) {
			if (label.top - 20 > r.top + inset) points['20px above the label'] = [cx, label.top - 20];
			if (label.bottom + 20 < r.bottom - inset) points['20px below the label'] = [cx, label.bottom + 20];
			if (label.right + 20 < r.right - inset) points['20px right of the label'] = [label.right + 20, cy];
		}
		const bad = [];
		for (const [point, [x, y]] of Object.entries(points)) {
			const top = document.elementFromPoint(x, y);
			if (!top || !(top === slot || slot.contains(top))) {
				bad.push({ point, x: Math.round(x), y: Math.round(y), top: top ? `${top.tagName.toLowerCase()}.${top.className || ''}` : 'none' });
			}
		}
		return bad;
	});
}
