// paintOverflow.js - Phase 64.1 (D-03 / D-05): measure what a board element PAINTS against every ancestor that clips it.
// An element's layout rect is not what the player sees: a box-shadow, an outline, a count badge hanging off a pile or a
// hover lift all paint outside it, and any ancestor with overflow other than "visible" cuts that paint flat at its padding
// box. Note that a scroll box (overflow-x: auto) also clips VERTICALLY, because overflow-y then computes to auto: the board
// rows are such boxes, so they clip a tile's shadow above and below even where the board itself has room.
// Not measured: filter: drop-shadow (its blur extent is engine-dependent), so a drop-shadow glow is only judged by eye.

/**
 * For every element matching `selector`: grow its rect by its box-shadow and outline reach, then compare it to the padding
 * box of every clipping ancestor. Returns the violations as [{ el, ancestor, side, px }]; an empty array means all inside.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {{ shadow?: boolean, outline?: boolean }} [opts] shadow: include box-shadow reach (default true), outline: include outline reach (default true)
 */
export async function readPaintOverflow(page, selector, { shadow = true, outline = true } = {}) {
	return page.evaluate(({ sel, withShadow, withOutline }) => {
		const label = (el) => {
			const base = el.id ? `#${el.id}` : `.${(el.classList[0] || el.tagName.toLowerCase())}`;
			const extra = ['data-pile', 'data-slot-index'].map((a) => (el.hasAttribute(a) ? `[${a}=${el.getAttribute(a)}]` : '')).join('');
			return base + extra;
		};
		const ancestorLabel = (el) => (el.id ? `#${el.id}` : `.${el.classList[0] || el.tagName.toLowerCase()}`);

		// Split a computed box-shadow list at the commas that are not inside parentheses (rgba(...) has commas).
		const splitShadows = (value) => {
			const out = [];
			let depth = 0;
			let start = 0;
			for (let i = 0; i < value.length; i++) {
				if (value[i] === '(') depth++;
				else if (value[i] === ')') depth--;
				else if (value[i] === ',' && depth === 0) { out.push(value.slice(start, i)); start = i + 1; }
			}
			out.push(value.slice(start));
			return out.map((s) => s.trim()).filter(Boolean);
		};

		const violations = [];
		for (const el of document.querySelectorAll(sel)) {
			const r = el.getBoundingClientRect();
			if (!(r.width > 0 && r.height > 0)) continue;
			const cs = getComputedStyle(el);
			const paint = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };

			if (withShadow && cs.boxShadow && cs.boxShadow !== 'none') {
				for (const one of splitShadows(cs.boxShadow)) {
					if (/\binset\b/.test(one)) continue;
					// The colour's numbers carry no "px", so only the lengths match: offsetX, offsetY, blur, spread.
					const n = (one.match(/-?\d*\.?\d+px/g) || []).map(parseFloat);
					const [ox = 0, oy = 0, blur = 0, spread = 0] = n;
					paint.left = Math.min(paint.left, r.left + ox - spread - blur);
					paint.right = Math.max(paint.right, r.right + ox + spread + blur);
					paint.top = Math.min(paint.top, r.top + oy - spread - blur);
					paint.bottom = Math.max(paint.bottom, r.bottom + oy + spread + blur);
				}
			}
			if (withOutline && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) {
				const reach = Math.max(0, parseFloat(cs.outlineWidth) + (parseFloat(cs.outlineOffset) || 0));
				paint.left -= reach; paint.right += reach; paint.top -= reach; paint.bottom += reach;
			}

			for (let anc = el.parentElement; anc; anc = anc.parentElement) {
				const acs = getComputedStyle(anc);
				if (acs.overflowX === 'visible' && acs.overflowY === 'visible') continue;
				const a = anc.getBoundingClientRect();
				const clip = {
					left: a.left + anc.clientLeft,
					top: a.top + anc.clientTop,
				};
				clip.right = clip.left + anc.clientWidth;
				clip.bottom = clip.top + anc.clientHeight;
				const sides = {
					left: clip.left - paint.left,
					right: paint.right - clip.right,
					top: clip.top - paint.top,
					bottom: paint.bottom - clip.bottom,
				};
				for (const [side, px] of Object.entries(sides)) {
					if (px > 0.5) violations.push({ el: label(el), ancestor: ancestorLabel(anc), side, px: Math.round(px * 10) / 10 });
				}
			}
		}
		return violations;
	}, { sel: selector, withShadow: shadow, withOutline: outline });
}
