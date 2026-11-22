// readStripPanel.js - Phase 72.1-07: the numbers the attack preview panel is judged by, read from the live page.
// Returns { vw, vh, strip, text, lines: [{ kind, rect, scrollW, clientW, scrollH, clientH, shown }], confirm, cancel, bar, barHit, textShown }
// (rects are { x, y, w, h, right, bottom } rounded to 0.1, null when the node is absent or not drawn); barHit = the element at the
// bar's centre is inside the bar (the bar stays tappable). Reads only.
/** @param {import('@playwright/test').Page} page @param {string} [targetSelector] a tile whose rect is wanted as `target` */
export async function readStripPanel(page, targetSelector = '') {
	return page.evaluate((targetSel) => {
		const n = (v) => Math.round(v * 10) / 10;
		const box = (el) => {
			if (!el) return null;
			const r = el.getBoundingClientRect();
			if (r.width === 0 && r.height === 0) return null;
			return { x: n(r.left), y: n(r.top), w: n(r.width), h: n(r.height), right: n(r.right), bottom: n(r.bottom) };
		};
		const strip = document.getElementById('status-strip');
		const bar = document.getElementById('phone-bar');
		const barBox = box(bar);
		let barHit = false;
		if (barBox) {
			const hit = document.elementFromPoint(barBox.x + barBox.w / 2, barBox.y + barBox.h / 2);
			barHit = !!hit && bar.contains(hit);
		}
		return {
			vw: window.innerWidth,
			vh: window.innerHeight,
			kind: strip?.getAttribute('data-status-kind') || '',
			strip: box(strip),
			text: box(strip?.querySelector('.status-strip__text')),
			textValue: strip?.querySelector('.status-strip__text')?.textContent || '',
			lines: [...(strip?.querySelectorAll('.strip-line') || [])].map((el) => ({
				kind: [...el.classList].find((c) => c.startsWith('strip-line--'))?.replace('strip-line--', '') || '',
				text: el.textContent,
				rect: box(el),
				scrollW: el.scrollWidth, clientW: el.clientWidth, scrollH: el.scrollHeight, clientH: el.clientHeight,
			})),
			confirm: box(strip?.querySelector('[data-confirm]')),
			cancel: box(strip?.querySelector('[data-cancel]')),
			bar: barBox,
			barHit,
			target: targetSel ? box(document.querySelector(targetSel)) : null,
		};
	}, targetSelector);
}
