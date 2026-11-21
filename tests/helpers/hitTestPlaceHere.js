// hitTestPlaceHere.js - Phase 65-07 (D-11): the hit-test of the gold "Place here" label on a phone. Same technique as slot-tiles.spec.js
// hitTestLabel: the label is pointer-events none, and elementFromPoint skips such elements, so the label gets pointer-events auto for
// the length of the call only; the answer is then decided by the stacking order alone. The label must be the topmost element at its
// centre (or something inside the marked slot), and NOT the bar, the drawer, the scrim, a hand card, the action tray or the toast.
// Returns { ok, why, label } (never throws); log it as `[65 D-11] <case> <viewport>: {...}`.

/** @param {import('@playwright/test').Page} page */
export async function hitTestPlaceHere(page) {
	return page.evaluate(() => {
		const label = document.querySelector('[data-place-here-label]');
		if (!label) return { ok: false, why: 'no label in the document' };
		const r = label.getBoundingClientRect();
		const x = r.left + r.width / 2;
		const y = r.top + r.height / 2;
		if (!(r.width > 0 && r.height > 0)) return { ok: false, why: 'label has no size' };
		if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return { ok: false, why: 'label centre is outside the viewport', x, y };
		const previous = label.style.pointerEvents;
		label.style.pointerEvents = 'auto';
		const top = document.elementFromPoint(x, y);
		label.style.pointerEvents = previous;
		const describe = (el) => (el ? `${el.tagName.toLowerCase()}.${el.className || ''}` : 'none');
		const inLabel = !!top && (top === label || label.contains(top));
		const inSlot = !!top && !!top.closest('[data-place-here]');
		const coveredBy = top ? top.closest('#phone-bar, .game-hand-panel, .phone-drawer-scrim, .hand-card-wrap, [data-action-tray], .board-toast') : null;
		return {
			ok: (inLabel || inSlot) && !coveredBy,
			why: `topmost at (${Math.round(x)}, ${Math.round(y)}) = ${describe(top)}`,
			coveredBy: coveredBy ? describe(coveredBy) : null,
			label: { left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
		};
	});
}
