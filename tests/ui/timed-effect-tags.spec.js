/**
 * timed-effect-tags.spec.js - Phase 72-06 (D-07, NUI-02): timed effects on a Mosje show as tag lines on its tile
 * (max 2 lines, then "+N more"), read from state. Headless at 1920x1080 (run through a temp config).
 */
import { test, expect } from '@playwright/test';
import { openOwnDetails } from '../helpers/boardTaps.js';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, clearEntryProtection,
} from './helpers.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const SHOT = '.planning/phases/72-screens-for-the-new-design/shots/72-06-timed-tags.png';
const hook = (page, name, ...args) => page.evaluate(({ name, args }) => window.__testHooks[name](...args), { name, args });
const own = (page, cardId) => page.locator(`.board-zone--player .card[data-card-id="${cardId}"]`).first();

async function boot(page) {
	await seedOfflineSession(page);
	const problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_fissa', { mp: 30, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_michelle', { mp: 20, level: 1 });
	await clearEntryProtection(page);
	return problems;
}

test('one timed effect: one tag with the exact text; none without effects', async ({ page }) => {
	const problems = await boot(page);
	await expect(page.locator('.tile-tags')).toHaveCount(0);
	await hook(page, 'addTimedEffect', 'player_1', 0, { kind: 'power', amount: 10, duration: 'untilEndOfYourNextTurn' });
	const tags = own(page, 'mosje_alyssa_fissa').locator('.tile-tag, .tag-line:not(.tag-line--more)');
	await expect(tags).toHaveCount(1);
	await expect(tags.first()).toHaveText('+10 Power until end of next turn');
	expect(problems).toEqual([]);
});

test('three entries: 2 lines and "+1 more", clear of the MP and Power numbers, detail still opens; screenshot', async ({ page }) => {
	await boot(page);
	await hook(page, 'attachToMosje', 'player_1', 0, 'piecie_dumbbells');
	await hook(page, 'addTimedEffect', 'player_1', 0, { kind: 'power', amount: 10, duration: 'untilEndOfYourNextTurn' });
	await hook(page, 'addQuestDiceGrant', 'player_1', { amount: -1, lasts: 'untilUsed', slotIndex: 0, cardId: 'mosje_alyssa_fissa' });
	await hook(page, 'addTimedEffect', 'player_1', 0, { kind: 'noLevelDrop', amount: 1, duration: 'untilEndOfYourNextTurn' });
	const tile = own(page, 'mosje_alyssa_fissa');
	await expect(tile.locator('.tile-tags .tag-line:not(.tag-line--more)')).toHaveCount(2);
	await expect(tile.locator('.tile-tags .tag-line--more')).toHaveText('+1 more');
	await expect(tile.locator('.tile-chips .chip')).toHaveCount(1);

	const tags = await tile.locator('.tile-tags').boundingBox();
	const chips = await tile.locator('.tile-chips').boundingBox();
	const box = await tile.boundingBox();
	expect(tags.x).toBeGreaterThanOrEqual(box.x - 1);
	expect(tags.x + tags.width).toBeLessThanOrEqual(box.x + box.width + 1);
	expect(tags.y + tags.height).toBeLessThanOrEqual(chips.y + 1); // above the chip row
	// the MP and Power numbers sit below the chip row: the tags must not overlap anything that shows them
	for (const sel of ['.card-v1__power, .cv1-power, [class*="power"]', '.card-v1__mp, .cv1-mp, [class*="-mp"]']) {
		for (const el of await tile.locator(sel).all()) {
			const b = await el.boundingBox();
			if (!b || b.width < 2 || b.height < 2 || b.width > box.width * 0.6) continue;
			const overlap = !(b.y >= tags.y + tags.height || b.y + b.height <= tags.y || b.x >= tags.x + tags.width || b.x + b.width <= tags.x);
			expect(overlap, `tags overlap ${sel}`).toBe(false);
		}
	}

	await page.screenshot({ path: SHOT });
	// the tile still opens its detail
	await openOwnDetails(page, 'mosje', 0);
	await expect(page.locator('.card-detail .cd-name')).toBeVisible();
});

test('state only: tags follow state when effects change', async ({ page }) => {
	await boot(page);
	await hook(page, 'addQuestDiceGrant', 'player_2', { amount: -1, lasts: 'untilUsed', slotIndex: 0, cardId: 'mosje_michelle' });
	await expect(page.locator('.board-zone--opponent .card[data-card-id="mosje_michelle"] .tile-tags')).toContainText('Rolls 1 die less on its next Quest');
	await expect(own(page, 'mosje_alyssa_fissa').locator('.tile-tags')).toHaveCount(0);
});
