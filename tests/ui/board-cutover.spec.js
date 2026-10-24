/**
 * board-cutover.spec.js - 63-06 (UI-05, D-07, D-21 a): the cut-over to the tap flow. The top bar keeps only the turn label,
 * How to Win and Battle Log (no Attack / Quest), field tiles carry no Ability / Activate buttons, and both actions are
 * reachable only as chips in the tray that opens when you tap your own card. Saves tests/ui/screenshots/board-2-0/u6-cutover.png.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, setHand, setEnergy, clearEntryProtection, unlockPiecies,
} from './helpers.js';
import { tapOwnCard } from '../helpers/boardTaps.js';

const SHOT_DIR = 'tests/ui/screenshots/board-2-0';

async function boot(page) {
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_tuk_healer', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_ming_natural', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_2', 1, 'mosje_ronald_chef', { mp: 50, level: 1 });
	await clearEntryProtection(page);
	await page.evaluate(() => {
		window.__testHooks.setPiecieOnField('player_1', 0, 'piecie_ronald_kip', { faceDown: true });
		window.__testHooks.setPiecieOnField('player_1', 1, 'piecie_kannetje_melk', { faceDown: true });
	});
	await unlockPiecies(page, 'player_1');
	await setHand(page, 'player_1', ['piecie_broodje_doner', 'piecie_kannetje_melk', 'piecie_momentum_boost']);
	await setHand(page, 'player_2', []);
	await setEnergy(page, 'player_1', 4);
}

test('U6: no Attack / Quest in the top bar and no Ability / Activate on the tiles; they live in the tray', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page);

	// Top bar: the turn label, How to Win and Battle Log only.
	for (const id of ['attack', 'quest']) await expect(page.locator(`#btn-${id}`), `no ${id} button in the top bar`).toHaveCount(0);
	await expect(page.locator('.topbar-actions button')).toHaveText(['How to Win 🏆', 'Battle Log']);
	await expect(page.locator('#turn-label')).toBeVisible();

	// Tiles: no Ability / Activate button on any own tile (the state badges are buttons of their own and stay).
	await expect(page.locator('[class*="ability-btn"]'), 'no ability button on any tile').toHaveCount(0);
	await expect(page.locator('#zone-player .card button:not(.tile-badge)')).toHaveCount(0);
	await expect(page.locator('#piecies-player .card button:not(.tile-badge)')).toHaveCount(0);

	// A Mosje with an activated ability: tap it, the tray offers Attack, Quest, Ability (with its Energy cost) and Details.
	await tapOwnCard(page, 'mosje', 'mosje_tuk_healer');
	await expect(page.locator('[data-action-tray] [data-action]')).toHaveText(['Attack', 'Quest', 'Ability · 1 Energy', 'Details']);
	await expect(page.locator('[data-action-tray] [data-action="ability"]')).toHaveAttribute('aria-disabled', 'false');
	await page.mouse.move(2, 2);
	await page.waitForTimeout(400);
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/u6-cutover.png` });
	await page.keyboard.press('Escape');

	// A ready Piecie: its Activate chip (with the cost) is in its tray, not on the tile.
	await tapOwnCard(page, 'piecie', 'piecie_ronald_kip');
	await expect(page.locator('[data-action-tray] [data-action="activate"]')).toHaveText('Activate · 2 Energy');
});
