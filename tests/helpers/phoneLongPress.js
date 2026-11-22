// phoneLongPress.js - Phase 72.1-05: a real touch hold for the phone specs, in the style of phoneSwipe.js. Sends touchStart at `at`,
// optional touchMove steps (a drift or a swipe), holds for `holdMs`, then touchEnd (or touchCancel) through the Chrome DevTools
// Protocol (Input.dispatchTouchEvent), so the page's own touch listeners see a finger. Chromium only.

/**
 * Hold one finger at `at` (CSS px, viewport coordinates).
 * @param {import('@playwright/test').Page} page
 * @param {{ at: {x: number, y: number}, holdMs?: number, moveTo?: {x: number, y: number}, steps?: number, cancel?: boolean,
 *   cancelAtMs?: number, afterFirstMove?: () => Promise<void> }} opts
 *   moveTo: finger drifts to this point in `steps` touchMove events right after the touchStart (the hold time then runs from there);
 *   cancel: finish with touchCancel instead of touchEnd; cancelAtMs: send touchCancel after this many ms and stop (a mid-hold cancel);
 *   afterFirstMove: awaited right after the first touchMove (65-03b: where real Android Chrome fires its pointercancel, ~15 ms in).
 */
export async function longPress(page, { at, holdMs = 600, moveTo, steps = 4, cancel = false, cancelAtMs, afterFirstMove }) {
	const cdp = await page.context().newCDPSession(page);
	const send = (type, point) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: point ? [{ x: point.x, y: point.y }] : [] });
	try {
		await send('touchStart', at);
		if (cancelAtMs !== undefined) {
			await page.waitForTimeout(cancelAtMs);
			await send('touchCancel', null);
			return;
		}
		const to = moveTo || at;
		for (let i = 1; i <= steps; i++) {
			const t = i / steps;
			await send('touchMove', { x: at.x + (to.x - at.x) * t, y: at.y + (to.y - at.y) * t });
			if (i === 1 && afterFirstMove) await afterFirstMove();
			await page.waitForTimeout(16);
		}
		await page.waitForTimeout(holdMs);
		await send(cancel ? 'touchCancel' : 'touchEnd', null);
	} finally {
		await cdp.detach().catch(() => {});
	}
}
