// phoneViewports.js - Phase 65 (D-19 a): the two phone sizes every phone spec runs at, and the Playwright context options of a
// touch phone. Use: `for (const vp of PHONE_VIEWPORTS) test.describe(vp.name, () => { test.use(phoneUse(vp)); ... })`.

/** The two portrait phone sizes the whole phase is judged at (a small Android, an iPhone). */
export const PHONE_VIEWPORTS = [
	{ name: '390x844', width: 390, height: 844 },
	{ name: '360x740', width: 360, height: 740 },
];

/** The test.use() options of a touch phone at this viewport: isMobile + hasTouch, so (pointer: coarse) and (hover: none) hold. */
export function phoneUse(vp) {
	return {
		viewport: { width: vp.width, height: vp.height },
		isMobile: true,
		hasTouch: true,
		deviceScaleFactor: 2,
	};
}
