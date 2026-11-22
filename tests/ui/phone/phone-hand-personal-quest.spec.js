/**
 * phone-hand-personal-quest.spec.js - Phase 72.1-05 (D-02, D-04, D-08): a Personal Quest in the phone hand can be raised, read and
 * played. The dock shows the engine's one-sentence reason (no Level 3 Mosje) with Play off, "Play to attempt it" once a Level 3
 * Mosje may attempt it, Play opens the Mosje pick, Details opens the 72-04 detail with its Play button and the same reason text as
 * on desktop. Real taps through the `phone` project at 395x731, 390x844 and 360x740.
 */
import { test, expect } from '@playwright/test';
import { setMosjeOnField, clearEntryProtection } from '../helpers.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { rectOf } from '../../helpers/phoneGeometry.js';
import { seedPhoneBoard } from '../../helpers/phoneBoard.js';
import { raiseCard, FISSA } from '../../helpers/phoneRaise.js';
import { savePhoneShot } from '../../helpers/savePhoneShot.js';

const PQ = 'pq_charge';
const NO_L3 = 'You have no Level 3 Mosje';
const dock = (page) => page.locator('#phone-bar [data-raise-dock]');

async function seed(page) {
	await seedPhoneBoard(page, { hand: [PQ, FISSA], energy: 6 });
	await page.waitForTimeout(300);
}

async function makeLevel3(page) {
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 3 });
	await clearEntryProtection(page);
	await page.waitForTimeout(400);
}

async function expectDockControlsBigEnough(page) {
	for (const sel of ['[data-raise-details]', '[data-raise-play]', '[data-raise-cancel]']) {
		const box = await rectOf(page, sel);
		expect(box.h, `${sel} height`).toBeGreaterThanOrEqual(44);
		expect(box.w, `${sel} width`).toBeGreaterThanOrEqual(44);
	}
}

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone Personal Quest in the hand at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test.beforeEach(async ({ page }) => { test.setTimeout(90000); await seed(page); });

		test('(a) no Level 3 Mosje: a tap raises and plays nothing, the dock shows the reason, Play is off and toasts it', async ({ page }) => {
			const before = await page.evaluate(() => window.__testHooks.getGameState().players.player_1.hand.length);
			await raiseCard(page, PQ);
			await page.waitForTimeout(500);
			expect(await page.evaluate(() => window.__testHooks.getGameState().players.player_1.hand.length), 'nothing played').toBe(before);
			await expect(dock(page)).toContainText('Charge!');
			await expect(dock(page)).toContainText(NO_L3);
			await expect(page.locator('[data-raise-play]')).toHaveAttribute('aria-disabled', 'true');
			await expectDockControlsBigEnough(page);
			if (vp.name === PIXEL_VIEWPORT.name) await savePhoneShot(page, '72.1-05-hand-personal-quest'); // the one screenshot of the plan
			await page.locator('[data-raise-play]').tap({ force: true }); // Playwright treats aria-disabled as not enabled; a finger can still tap it
			await expect(page.locator('#board-toast')).toHaveText(NO_L3);
			await expect(page.locator('.modal-mosje-select-btn')).toHaveCount(0);
		});

		test('(b) Details on a blocked Personal Quest opens the detail with a disabled Play and the same reason', async ({ page }) => {
			await raiseCard(page, PQ);
			await page.locator('[data-raise-details]').tap();
			await expect(page.locator('.card-detail')).toBeVisible();
			const play = page.locator('.card-detail .cd-actions button[data-action-id="play"]');
			await expect(play).toBeDisabled();
			await expect(play).toHaveAttribute('title', NO_L3);
			await expect(page.locator('.card-detail .cd-why')).toContainText(NO_L3);
		});

		test('(c) with a legal Level 3 Mosje the dock says "Play to attempt it" and Play opens the Mosje pick; the drawer closes', async ({ page }) => {
			await makeLevel3(page);
			await raiseCard(page, PQ);
			await expect(dock(page)).toContainText('Play to attempt it');
			await expect(page.locator('[data-raise-play]')).not.toHaveAttribute('aria-disabled', 'true');
			await expectDockControlsBigEnough(page);
			await page.locator('[data-raise-play]').tap();
			await expect(page.locator('.modal-mosje-select-btn').first()).toBeVisible();
			await expect(page.locator('.modal-option--card').first()).toBeVisible();
			await expect(page.locator('.game-hand-panel')).toHaveAttribute('data-drawer', 'closed');
		});

		test('(d) Details on a playable Personal Quest has an enabled Play that opens the Mosje pick', async ({ page }) => {
			await makeLevel3(page);
			await raiseCard(page, PQ);
			await page.locator('[data-raise-details]').tap();
			const play = page.locator('.card-detail .cd-actions button[data-action-id="play"]');
			await expect(play).toBeEnabled();
			await expect(page.locator('.card-detail .cd-why')).toHaveCount(0);
			await page.waitForTimeout(900);
			await play.tap();
			await expect(page.locator('.modal-mosje-select-btn').first()).toBeVisible();
		});

		test('(e) an Energy card in the same hand still raises and plays as before (Phase 65 dock unchanged)', async ({ page }) => {
			await setMosjeOnField(page, 'player_1', 0, null);
			await raiseCard(page, FISSA);
			await expect(dock(page)).toContainText('Costs');
		});
	});
}
