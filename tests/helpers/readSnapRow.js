// readSnapRow.js - Phase 72.1-03 (D-13): what a snap-scroll row looks like right now, for the phone specs.
// Returns { scrollWidth, clientWidth, scrollLeft, snapType, snapStop, flexWrap, overflowX, overflowY, itemLefts, itemWidths }:
// lefts are viewport x of each direct child, widths their widths (CSS px, rounded to 0.1), snapStop is the first item's scroll-snap-stop.
/** @param {import('@playwright/test').Page} page @param {string} selector the row container */
export async function readSnapRow(page, selector) {
	return page.evaluate((sel) => {
		const row = document.querySelector(sel);
		if (!row) return null;
		const cs = getComputedStyle(row);
		const n = (v) => Math.round(v * 10) / 10;
		const items = [...row.children];
		return {
			scrollWidth: row.scrollWidth,
			clientWidth: row.clientWidth,
			scrollLeft: Math.round(row.scrollLeft),
			snapType: cs.scrollSnapType,
			snapStop: items[0] ? getComputedStyle(items[0]).scrollSnapStop : '',
			flexWrap: cs.flexWrap,
			overflowX: cs.overflowX,
			overflowY: cs.overflowY,
			rowLeft: n(row.getBoundingClientRect().left),
			rowRight: n(row.getBoundingClientRect().right),
			itemLefts: items.map((el) => n(el.getBoundingClientRect().left)),
			itemWidths: items.map((el) => n(el.getBoundingClientRect().width)),
		};
	}, selector);
}
