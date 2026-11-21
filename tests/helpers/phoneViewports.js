// phoneViewports.js - Phase 65 (D-19 a): the two phone sizes every phone spec runs at, and the Playwright context options of a
// touch phone. Use: `for (const vp of PHONE_VIEWPORTS) test.describe(vp.name, () => { test.use(phoneUse(vp)); ... })`.

/** The two portrait phone sizes the whole phase is judged at (a small Android, an iPhone). */
export const PHONE_VIEWPORTS = [
	{ name: '390x844', width: 390, height: 844 },
	{ name: '360x740', width: 360, height: 740 },
];

/** Gandalf's Pixel 8 Pro (Android Chrome): 395x880 full screen, about 395x731 visible with the address bar and the 3-button nav
 *  bar (measured 2026-10-28). Geometry specs run it next to PHONE_VIEWPORTS: `[...PHONE_VIEWPORTS, PIXEL_VIEWPORT]`. */
export const PIXEL_VIEWPORT = { name: '395x731', width: 395, height: 731 };

/** The test.use() options of a touch phone at this viewport: isMobile + hasTouch, so (pointer: coarse) and (hover: none) hold. */
export function phoneUse(vp) {
	return {
		viewport: { width: vp.width, height: vp.height },
		isMobile: true,
		hasTouch: true,
		deviceScaleFactor: 3,
	};
}
