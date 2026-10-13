// answerModals — click through the option / target modals a Mosje ability opens.
// picks: [string | RegExp] consumed in order (matched on the button text); with no pick left the first enabled option is taken.
// Stops when no modal shows for a short moment. Returns the labels that were clicked (for debugging).
const OPTION = '.modal-mosje-select-btn:not([disabled]), .target-option:not([disabled]), #modal-continue';

export async function answerModals(page, picks = [], { max = 14, wait = 700 } = {}) {
	const clicked = [];
	const queue = [...picks];
	for (let i = 0; i < max; i++) {
		const first = page.locator(OPTION).first();
		if (!(await first.isVisible({ timeout: wait }).catch(() => false))) break;
		let btn = first;
		const want = queue[0];
		if (want !== undefined) {
			const match = page.locator(OPTION).filter({ hasText: want });
			if (await match.count()) { btn = match.first(); queue.shift(); }
		}
		clicked.push((await btn.innerText().catch(() => '?')).replace(/\s+/g, ' ').trim());
		await btn.click();
		await page.waitForTimeout(200);
	}
	return clicked;
}
