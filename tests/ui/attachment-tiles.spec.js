/**
 * attachment-tiles.spec.js - Phase 72-05 (D-05, D-06, NUI-02): attachments are chips on the Mosje tile (own and opponent, max 3),
 * a chip tap opens the attached card's detail, and the Mosje detail and the hover dock list them with "Attachments n / max".
 * Headless at 1920x1080 (run through a temp config).
 */
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, clearEntryProtection,
} from './helpers.js';
import { openOwnDetails } from '../helpers/boardTaps.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const SHOT = '.planning/phases/72-screens-for-the-new-design/shots/72-05-attachments.png';
const attach = (page, pid, slot, cardId) =>
	page.evaluate(({ pid, slot, cardId }) => window.__testHooks.attachToMosje(pid, slot, cardId), { pid, slot, cardId });

async function boot(page) {
	await seedOfflineSession(page);
	const problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_fissa', { mp: 30, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_jeffrey', { mp: 30, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_michelle', { mp: 20, level: 1 });
	await clearEntryProtection(page);
	return problems;
}

const own = (page, cardId) => page.locator(`.board-zone--player .card[data-card-id="${cardId}"]`).first();
const opp = (page, cardId) => page.locator(`.board-zone--opponent .card[data-card-id="${cardId}"]`).first();

test('chips on own, opponent and Jeffrey tiles; none without attachments', async ({ page }) => {
	const problems = await boot(page);
	await expect(page.locator('.tile-chips')).toHaveCount(0);

	await attach(page, 'player_1', 0, 'piecie_dumbbells');
	await attach(page, 'player_1', 0, 'piecie_keyboard');
	await attach(page, 'player_2', 0, 'piecie_tony');
	await attach(page, 'player_1', 1, 'piecie_dumbbells');
	await attach(page, 'player_1', 1, 'piecie_keyboard');
	await attach(page, 'player_1', 1, 'piecie_controller');

	await expect(own(page, 'mosje_alyssa_fissa').locator('.tile-chips .chip')).toHaveCount(2);
	await expect(own(page, 'mosje_alyssa_fissa').locator('.tile-chips .chip').first()).toHaveText('Dumbbells');
	await expect(opp(page, 'mosje_michelle').locator('.tile-chips .chip')).toHaveCount(1);
	await expect(opp(page, 'mosje_michelle').locator('.tile-chips .chip')).toHaveText('Tony');
	await expect(own(page, 'mosje_jeffrey').locator('.tile-chips .chip')).toHaveCount(3);
	await expect(own(page, 'mosje_jeffrey')).toHaveAttribute('data-max-attachments', '3');

	// the chips stay inside the tile
	const tile = await own(page, 'mosje_jeffrey').boundingBox();
	for (const c of await own(page, 'mosje_jeffrey').locator('.tile-chips .chip').all()) {
		const b = await c.boundingBox();
		expect(b.x).toBeGreaterThanOrEqual(tile.x - 1);
		expect(b.x + b.width).toBeLessThanOrEqual(tile.x + tile.width + 1);
	}
	expect(problems).toEqual([]);
});

test('a chip tap opens the attached card detail, not the Mosje detail', async ({ page }) => {
	await boot(page);
	await attach(page, 'player_1', 0, 'piecie_dumbbells');
	await attach(page, 'player_1', 0, 'piecie_keyboard');
	await own(page, 'mosje_alyssa_fissa').locator('.tile-chips .chip').first().dispatchEvent('click');
	await expect(page.locator('.card-detail .cd-name')).toHaveText('Dumbbells');
});

test('Mosje detail lists attachments with full text and n / max', async ({ page }) => {
	await boot(page);
	await attach(page, 'player_1', 0, 'piecie_dumbbells');
	await attach(page, 'player_1', 0, 'piecie_keyboard');
	await openOwnDetails(page, 'mosje', 0);
	const detail = page.locator('.card-detail');
	await expect(detail.locator('.cd-attach-count')).toHaveText('Attachments 2 / 2');
	await expect(detail.locator('.cd-attach')).toHaveCount(2);
	await expect(detail.locator('.cd-attach').first()).toContainText('Dumbbells');
	await expect(detail.locator('.cd-attach').first()).toContainText('+1 die on Quests that roll Str');
	await page.locator('#modal-close-preview').click();

	await openOwnDetails(page, 'mosje', 1);
	await expect(page.locator('.card-detail .cd-attach-count')).toHaveText('Attachments 0 / 3');
});

test('hover dock shows the attachments line', async ({ page }) => {
	await boot(page);
	await attach(page, 'player_1', 0, 'piecie_dumbbells');
	await attach(page, 'player_1', 0, 'piecie_keyboard');
	await page.mouse.move(5, 5);
	await own(page, 'mosje_alyssa_fissa').hover({ position: { x: 60, y: 60 } });
	await expect(page.locator('.hover-zoom__panel .cv2-panel-line--attachments')).toHaveText('Attachments 2 / 2: Dumbbells, Keyboard');
});

test('screenshot: Jeffrey with 3, opponent Mosje with 2', async ({ page }) => {
	await boot(page);
	await attach(page, 'player_1', 1, 'piecie_dumbbells');
	await attach(page, 'player_1', 1, 'piecie_keyboard');
	await attach(page, 'player_1', 1, 'piecie_controller');
	await attach(page, 'player_2', 0, 'piecie_tony');
	await attach(page, 'player_2', 0, 'piecie_mouse');
	await page.mouse.move(5, 5);
	await page.waitForTimeout(500);
	await page.screenshot({ path: SHOT });
});
