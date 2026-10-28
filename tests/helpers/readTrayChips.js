// readTrayChips.js - Phase 65-09: the chips of the open action tray as rounded boxes, in DOM order, for the 44 px / no-overlap checks.

/** @param {import('@playwright/test').Page} page @returns {Promise<{ action: string, x: number, y: number, w: number, h: number, right: number, bottom: number }[]>} */
export async function readTrayChips(page) {
	return page.evaluate(() => [...document.querySelectorAll('[data-action-tray] [data-action]')].map((el) => {
		const r = el.getBoundingClientRect();
		const n = (v) => Math.round(v * 10) / 10;
		return { action: el.dataset.action, x: n(r.left), y: n(r.top), w: n(r.width), h: n(r.height), right: n(r.right), bottom: n(r.bottom) };
	}));
}
