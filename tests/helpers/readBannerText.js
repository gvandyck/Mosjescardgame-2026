// readBannerText.js - Phase 65-09: is the status strip message cut? Reads #status-strip .status-strip__text: its box and scroll sizes,
// and the height the SAME text needs when nothing clamps it (a hidden clone at the same width, so a line clamp cannot hide the cut).
// fullLines = lines the whole message needs at that width; cut = it needs more room than the visible box gives.

/** @param {import('@playwright/test').Page} page @returns the numbers, or null when the strip has no text */
export async function readBannerText(page) {
	return page.evaluate(() => {
		const el = document.querySelector('#status-strip .status-strip__text');
		if (!el) return null;
		const cs = getComputedStyle(el);
		const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
		const clone = el.cloneNode(true);
		Object.assign(clone.style, {
			position: 'absolute', visibility: 'hidden', display: 'block', overflow: 'visible', height: 'auto', maxHeight: 'none',
			width: `${el.clientWidth}px`, webkitLineClamp: 'unset', textOverflow: 'clip',
		});
		el.parentElement.appendChild(clone);
		const fullH = clone.getBoundingClientRect().height;
		const fullW = clone.scrollWidth;
		clone.remove();
		return {
			text: el.textContent, scrollW: el.scrollWidth, clientW: el.clientWidth, scrollH: el.scrollHeight, clientH: el.clientHeight,
			fullLines: Math.round(fullH / lh), fullH: Math.round(fullH * 10) / 10, fullW,
			cut: el.scrollWidth > el.clientWidth + 1 || fullH > el.clientHeight + 1 || fullW > el.clientWidth + 1,
		};
	});
}
