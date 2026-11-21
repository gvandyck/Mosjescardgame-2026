// readSheet.js - Phase 65-08: the numbers a phone sheet is judged by, read from the live page. The first .modal-card in #modal-root
// (box, padding, scroll sizes), the backdrop's alpha and blur, and the window it sits in. Reads only; null when no modal is open.

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} [scrollSel] a selector inside the card whose scroll sizes are wanted too (e.g. '.modal-card-list')
 */
export async function readSheet(page, scrollSel = '') {
	return page.evaluate((scrollSel) => {
		const card = document.querySelector('#modal-root .modal-card');
		if (!card) return null;
		const back = document.querySelector('#modal-root .modal-backdrop');
		const r = card.getBoundingClientRect();
		const cs = getComputedStyle(card);
		const bs = back ? getComputedStyle(back) : null;
		const parts = bs ? bs.backgroundColor.match(/rgba?\(([^)]+)\)/)?.[1].split(',').map(Number) : null;
		const inner = scrollSel ? card.querySelector(scrollSel) : null;
		const n = (v) => Math.round(v * 10) / 10;
		return {
			left: n(r.left), right: n(r.right), top: n(r.top), bottom: n(r.bottom), width: n(r.width), height: n(r.height),
			innerWidth: window.innerWidth, innerHeight: window.innerHeight,
			paddingBottom: parseFloat(cs.paddingBottom), overflowY: cs.overflowY,
			scrollWidth: card.scrollWidth, clientWidth: card.clientWidth, scrollHeight: card.scrollHeight, clientHeight: card.clientHeight,
			backAlpha: parts ? (parts.length > 3 ? parts[3] : 1) : 0, backFilter: bs ? bs.backdropFilter : 'none',
			inner: inner ? { overflowY: getComputedStyle(inner).overflowY, scrollHeight: inner.scrollHeight, clientHeight: inner.clientHeight } : null,
		};
	}, scrollSel);
}
