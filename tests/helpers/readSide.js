// readSide.js - Phase 65-04: one player's side of the table as plain numbers, for the phone sides spec. side is 'player' or
// 'opponent'. Boxes are rounded to 0.1 px { x, y, w, h, right, bottom } (null when the element is absent). Reads the live page only.
// - row: scrollW / clientW of .board-zone__row (a sideways-scrolling row has scrollW > clientW)
// - slots: the boxes of `#zone-SIDE > *` (the 2 Mosje tiles or empty slots), piecies: `#piecies-SIDE > *` (3)
// - tile: computed width / height / --bu / offsetWidth of the first Mosje slot element
// - energy: the .energy-crystals box, how many gems, the .energy-count text
// - deck / discard / welloe: the pile box plus its .discard-pile__count-badge box (welloe is the button, null while it has no cards)
// - name: the box of the player name text in the zone header (a Range, so the modifier pills do not count)

/**
 * @param {import('@playwright/test').Page} page
 * @param {'player' | 'opponent'} side
 */
export async function readSide(page, side) {
	return page.evaluate((side) => {
		const n = (v) => Math.round(v * 10) / 10;
		const box = (el) => {
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return { x: n(r.left), y: n(r.top), w: n(r.width), h: n(r.height), right: n(r.right), bottom: n(r.bottom) };
		};
		const zone = document.querySelector(`[data-zone="${side}"]`);
		const q = (sel) => zone.querySelector(sel);
		const pile = (kind) => {
			const el = q(`[data-pile="${kind}"]`);
			return el ? { ...box(el), badge: box(el.querySelector('.discard-pile__count-badge')) } : null;
		};

		let name = null;
		const text = [...q('.board-zone__header').childNodes].find((node) => node.nodeType === 3 && node.textContent.trim());
		if (text) {
			const range = document.createRange();
			range.selectNodeContents(text);
			name = box(range);
		}

		const row = q('.board-zone__row');
		const first = q(`#zone-${side} > *`);
		const cs = first ? getComputedStyle(first) : null;
		return {
			row: { scrollW: row.scrollWidth, clientW: row.clientWidth },
			slots: [...zone.querySelectorAll(`#zone-${side} > *`)].map(box),
			piecies: [...zone.querySelectorAll(`#piecies-${side} > *`)].map(box),
			tile: first ? { w: parseFloat(cs.width), h: parseFloat(cs.height), bu: parseFloat(cs.getPropertyValue('--bu')), offsetW: first.offsetWidth } : null,
			energy: box(q('.energy-crystals')),
			gems: zone.querySelectorAll('.energy-gem').length,
			energyText: q('.energy-count')?.textContent ?? null,
			deck: pile('deck'),
			discard: pile('discard'),
			welloe: pile('welloe'),
			name,
		};
	}, side);
}
