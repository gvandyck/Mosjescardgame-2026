// phoneGeometry.js - Phase 65: small geometry readers for the phone specs (rounded boxes, overlap, 44 px targets, page overflow,
// the topmost element at a point). Everything reads the live page; nothing here changes it.

/** The rounded box { x, y, w, h, right, bottom } of the first match of `selector`, or null when there is none. */
export async function rectOf(page, selector) {
	return page.evaluate((sel) => {
		const el = document.querySelector(sel);
		if (!el) return null;
		const r = el.getBoundingClientRect();
		const n = (v) => Math.round(v * 10) / 10;
		return { x: n(r.left), y: n(r.top), w: n(r.width), h: n(r.height), right: n(r.right), bottom: n(r.bottom) };
	}, selector);
}

/** True when two boxes from rectOf share any area (touching edges do not count). */
export function intersects(a, b) {
	if (!a || !b) return false;
	return a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
}

/** Visible matches of `selector` whose box is smaller than min x min CSS px: [{ sel, w, h }]. An empty list means all big enough. */
export async function undersized(page, selector, min = 44) {
	return page.evaluate(({ sel, min }) => [...document.querySelectorAll(sel)].map((el) => {
		const r = el.getBoundingClientRect();
		return { sel, w: Math.round(r.width), h: Math.round(r.height) };
	}).filter((b) => b.w > 0 && b.h > 0 && !(b.w >= min && b.h >= min)), { sel: selector, min });
}

/** How far the page scrolls past the window: { x: scrollWidth - innerWidth, y: scrollHeight - innerHeight } (0 or less = none). */
export async function pageOverflow(page) {
	return page.evaluate(() => ({
		x: document.documentElement.scrollWidth - window.innerWidth,
		y: document.documentElement.scrollHeight - window.innerHeight,
	}));
}

/** What is topmost at a viewport point, as "tag.class" (document.elementFromPoint), or 'none'. */
export async function topmostAt(page, x, y) {
	return page.evaluate(({ x, y }) => {
		const el = document.elementFromPoint(x, y);
		return el ? `${el.tagName.toLowerCase()}.${el.className || ''}` : 'none';
	}, { x, y });
}
