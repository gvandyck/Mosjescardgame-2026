// readPlaceHereGeometry.js - Phase 65-07 (D-11): the boxes behind "nothing covers the marked slot" on a phone, stronger than a
// hit-test of one point: the whole slot box against the bottom bar, the viewport and the board. All numbers are CSS px.
// Returns null when no slot is marked. gap = bar top minus slot bottom (>= 4 means a clear strip above the bar); overlapsBar says
// the two boxes share any area; inViewport / inBoard say the slot AND its label are fully inside; drawer / visibleHandCards say the
// hand drawer is shut with no hand card on screen; layers lists the other fixed UI layers that currently intersect the slot.

/** @param {import('@playwright/test').Page} page */
export async function readPlaceHereGeometry(page) {
	return page.evaluate(() => {
		const slot = document.querySelector('[data-place-here]');
		if (!slot) return null;
		const label = slot.querySelector('[data-place-here-label]');
		const box = (el) => {
			const r = el.getBoundingClientRect();
			const n = (v) => Math.round(v * 10) / 10;
			return { left: n(r.left), top: n(r.top), right: n(r.right), bottom: n(r.bottom), w: n(r.width), h: n(r.height) };
		};
		const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
		const inside = (a, b) => a.left >= b.left - 0.5 && a.right <= b.right + 0.5 && a.top >= b.top - 0.5 && a.bottom <= b.bottom + 0.5;
		const s = box(slot);
		const l = label ? box(label) : null;
		const bar = box(document.getElementById('phone-bar'));
		const board = box(document.getElementById('board-root'));
		const view = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
		const layers = [...document.querySelectorAll('.game-hand-panel, .phone-drawer-scrim, [data-action-tray], .board-toast')]
			.filter((el) => getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none' && hit(s, box(el)))
			.map((el) => el.className || el.tagName);
		const handPanel = document.querySelector('.game-hand-panel');
		return {
			slot: s, label: l, bar, board,
			gap: Math.round((bar.top - s.bottom) * 10) / 10,
			overlapsBar: hit(s, bar),
			inViewport: inside(s, view) && (!l || inside(l, view)),
			inBoard: inside(s, board) && (!l || inside(l, board)),
			drawer: handPanel ? handPanel.dataset.drawer : null,
			visibleHandCards: [...document.querySelectorAll('.hand-card-wrap')].filter((el) => {
				const cs = getComputedStyle(el.closest('.game-hand-panel') || el);
				return cs.visibility !== 'hidden' && cs.display !== 'none';
			}).length,
			layers,
		};
	});
}
