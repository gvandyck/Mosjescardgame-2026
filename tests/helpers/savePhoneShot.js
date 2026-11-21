// savePhoneShot.js - Phase 72.1-02: one phone screenshot for the owner to review, written next to the phase plans (never committed).
import { mkdirSync } from 'node:fs';

const SHOTS_DIR = '.planning/phases/72.1-mobile-play-on-the-new-design/shots';

/** Save the current viewport as <SHOTS_DIR>/<name>.png and return the path. @param {import('@playwright/test').Page} page @param {string} name */
export async function savePhoneShot(page, name) {
	mkdirSync(SHOTS_DIR, { recursive: true });
	const path = `${SHOTS_DIR}/${name}.png`;
	await page.screenshot({ path });
	return path;
}
