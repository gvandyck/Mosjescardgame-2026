// phoneSwipe.js - Phase 65-03: a real touch swipe for the phone specs. locator.tap() cannot drag; this sends touchStart, a run of
// touchMove steps and touchEnd (or touchCancel) through the Chrome DevTools Protocol (Input.dispatchTouchEvent), so the page's
// own touchstart / touchmove / touchend listeners (and the browser's pan handling) see a finger drag. Chromium only.

/**
 * Drag one finger from `from` to `to` (CSS px, viewport coordinates).
 * @param {import('@playwright/test').Page} page
 * @param {{ from: {x: number, y: number}, to: {x: number, y: number}, steps?: number, stepDelay?: number, cancel?: boolean, afterFirstMove?: () => Promise<void> }} opts
 *   steps: number of touchMove events along the line; stepDelay: ms between them; cancel: finish with touchCancel instead of
 *   touchEnd (what Chrome sends when it takes the gesture over, e.g. for pull-to-refresh); afterFirstMove: awaited right after the
 *   first touchMove, before the next one (65-03b: where real Android Chrome fires its pointercancel, ~15 ms into the drag).
 */
export async function swipe(page, { from, to, steps = 8, stepDelay = 16, cancel = false, afterFirstMove }) {
	const cdp = await page.context().newCDPSession(page);
	const send = (type, point) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: point ? [{ x: point.x, y: point.y }] : [] });
	try {
		await send('touchStart', from);
		for (let i = 1; i <= steps; i++) {
			const t = i / steps;
			await send('touchMove', { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
			if (i === 1 && afterFirstMove) await afterFirstMove();
			await page.waitForTimeout(stepDelay);
		}
		await send(cancel ? 'touchCancel' : 'touchEnd', null);
	} finally {
		await cdp.detach().catch(() => {});
	}
}
