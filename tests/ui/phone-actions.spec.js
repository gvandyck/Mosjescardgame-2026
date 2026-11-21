/**
 * phone-actions.spec.js - Phase 65-09 (MOB-04; D-12, D-13, D-15, D-19 a/b): the Phase 63 field actions fit and clamp on a phone. At
 * 390x844, 360x740 and Gandalf's Pixel 8 Pro (395x731), by real touch taps (hasTouch):
 *  (a) the tray of my right-hand Mosje (4 chips) sits between the status strip and the bottom bar, inside the window, chips >= 44 px
 *      high and >= 72 px wide, none overlapping, nothing under the bar;      (b) the same for the lowest right Piecie (2 chips);
 *  (c) the Place tile's tray (1 chip) flips below and still ends above the bar;
 *  (d) attack: Attack -> choose-target (Cancel >= 44 px) -> tap the target -> the preview banner is NOT cut (<= 2 lines), Confirm and
 *      Cancel are >= 44 px, inside the window, not overlapping; Confirm resolves the attack in the engine;
 *  (e) Quest: the 3 Quest tiles are marked, wide and tappable; a tap opens the picker as a bottom sheet; the Quest resolves by touch;
 *  (f) the toast (a FRESH badge tap, a dimmed target tap) sits fully inside the window between the strip and the bar, text uncut;
 *  (g) D-12: with nothing selected, an opponent Mosje tile and a Quest tile open the detail view (Close >= 44 px); Details in a tray too.
 * The last two blocks write the progress screenshots (the ONLY writer of C:/tmp/65-09-*.png). Emulation proves layout and taps;
 * only Gandalf's phone proves real tap accuracy.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { getGameState, setMosjeOnField } from './helpers.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { seedActionsBoard } from '../helpers/phoneActionsBoard.js';
import { tapOwnCard, chooseTray, beginQuestByTap, clickThroughOptions, press, targetTile } from '../helpers/boardTaps.js';
import { rectOf, intersects, undersized } from '../helpers/phoneGeometry.js';
import { expectInFreeBand } from '../helpers/expectInFreeBand.js';
import { expectTrayChips } from '../helpers/expectTrayChips.js';
import { readBannerText } from '../helpers/readBannerText.js';
import { readSheet } from '../helpers/readSheet.js';
import { expectedAttackDamage } from '../helpers/expectedAttackDamage.js';
import { expectQuestShuffledBack } from '../helpers/expectQuestShuffledBack.js';

const TOUCH = { touch: true };
const SHOT_DIR = process.env.OBBY65_SHOT_DIR || 'C:/tmp';
const mp = (gs, pid, i) => gs.players[pid].activeSlots[i].mp;

/** Attack chip -> choose-target -> tap Gandoe -> the preview message is showing. */
async function openPreview(page) {
	await tapOwnCard(page, 'mosje', 0, TOUCH);
	await chooseTray(page, 'attack', TOUCH);
	await expect(page.locator('#status-strip')).toHaveAttribute('data-status-kind', 'choose-target');
	await press(targetTile(page, 'player_2:0'), TOUCH);
	await expect(page.locator('#status-strip')).toHaveAttribute('data-status-kind', 'preview');
}

for (const vp of [...PHONE_VIEWPORTS, PIXEL_VIEWPORT]) {
	test.describe(`phone field actions at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		let errors;
		test.beforeEach(async ({ page }) => {
			test.setTimeout(90000);
			errors = [];
			page.on('pageerror', (err) => errors.push(err.message));
			await seedActionsBoard(page);
		});
		test.afterEach(() => {
			expect(errors, 'no page errors').toEqual([]);
		});

		test('(a) the tray of my right-hand Mosje: 4 chips, 44 px, between the strip and the bar', async ({ page }) => {
			await tapOwnCard(page, 'mosje', 1, TOUCH);
			await page.waitForTimeout(200);
			await expectTrayChips(page, 4);
			await expectInFreeBand(page, '[data-action-tray]', { side: 4, gap: 4 });
		});

		test('(b) the tray of the lowest right Piecie: Activate and Details, above the tile or below but above the bar', async ({ page }) => {
			await tapOwnCard(page, 'piecie', 2, TOUCH);
			await page.waitForTimeout(200);
			await expectTrayChips(page, 2);
			const { box } = await expectInFreeBand(page, '[data-action-tray]', { side: 4, gap: 4 });
			const tile = await rectOf(page, '#piecies-player [data-zone="piecie"][data-slot-index="2"]');
			expect(box.bottom <= tile.y + 2 || box.y >= tile.bottom - 2, `the tray ${JSON.stringify(box)} is above or below the tile ${JSON.stringify(tile)}`).toBe(true);
		});

		test('(c) the Place tile tray (Details) flips below and still ends above the bar', async ({ page }) => {
			await tapOwnCard(page, 'place', 0, TOUCH);
			await page.waitForTimeout(200);
			await expectTrayChips(page, 1);
			const { box } = await expectInFreeBand(page, '[data-action-tray]', { side: 4, gap: 4 });
			const tile = await rectOf(page, '#board-place [data-zone="place"]');
			expect(box.y, `the Place tray starts under the tile (${tile.bottom})`).toBeGreaterThanOrEqual(tile.bottom - 2);
		});

		test('(d) attack: Cancel 44 px, the preview banner is not cut, Confirm and Cancel 44 px, Confirm resolves the attack', async ({ page }) => {
			const before = await getGameState(page);
			const power = await page.evaluate(() => window.__testHooks.getMosjePower('player_1', 0)); // includes the Drain Zone +10
			const targetMp = mp(before, 'player_2', 0);
			// 2.1 rules section 4: Bulldozer (Physical) beats Gandoe (Digital): +10; Gandoe has Resilient 1 star: -5.
			const damage = expectedAttackDamage(power, before.players.player_1.activeSlots[0].subtype, before.players.player_2.activeSlots[0]);
			await tapOwnCard(page, 'mosje', 0, TOUCH);
			await chooseTray(page, 'attack', TOUCH);
			await expect(page.locator('#status-strip')).toHaveAttribute('data-status-kind', 'choose-target');
			expect(await undersized(page, '#status-strip [data-cancel]'), 'Cancel in choose-target').toEqual([]);
			const choose = await readBannerText(page);
			console.log(`[65-09] choose-target banner: ${JSON.stringify(choose)}`);
			expect.soft(choose.cut, `the choose-target message must not be cut: ${JSON.stringify(choose)}`).toBe(false);

			await press(targetTile(page, 'player_2:0'), TOUCH);
			await expect(page.locator('#status-strip')).toHaveAttribute('data-status-kind', 'preview');
			const banner = await readBannerText(page);
			console.log(`[65-09] preview banner: ${JSON.stringify(banner)}`);
			expect.soft(banner.scrollW, `banner text scrollWidth ${banner.scrollW} <= clientWidth ${banner.clientW}`).toBeLessThanOrEqual(banner.clientW + 1);
			expect.soft(banner.scrollH, `banner text scrollHeight ${banner.scrollH} <= clientHeight ${banner.clientH}`).toBeLessThanOrEqual(banner.clientH + 1);
			expect.soft(banner.fullLines, `the message needs ${banner.fullLines} lines (at most 2)`).toBeLessThanOrEqual(2);
			expect.soft(banner.cut, `the preview message must not be cut: ${JSON.stringify(banner)}`).toBe(false);

			const confirm = await rectOf(page, '#status-strip [data-confirm]');
			const cancel = await rectOf(page, '#status-strip [data-cancel]');
			const win = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
			console.log(`[65-09] confirm ${JSON.stringify(confirm)} cancel ${JSON.stringify(cancel)}`);
			for (const [name, b] of [['Confirm', confirm], ['Cancel', cancel]]) {
				expect.soft(b.w, `${name} width >= 44`).toBeGreaterThanOrEqual(44);
				expect.soft(b.h, `${name} height >= 44`).toBeGreaterThanOrEqual(44);
				expect.soft(b.x, `${name} inside the window (left)`).toBeGreaterThanOrEqual(0);
				expect.soft(b.right, `${name} inside the window (right)`).toBeLessThanOrEqual(win.w);
			}
			expect.soft(intersects(confirm, cancel), 'Confirm and Cancel must not overlap').toBe(false);

			await press(page.locator('#status-strip [data-confirm]'), TOUCH);
			await expect.poll(async () => mp(await getGameState(page), 'player_2', 0), { message: 'engine: the target lost the attacker Power' }).toBe(targetMp - damage);
		});

		test('(e) Quest: three wide tappable Quest tiles, the picker is a bottom sheet, the Quest resolves by touch', async ({ page }) => {
			const stateBefore = await getGameState(page);
			const before = mp(stateBefore, 'player_1', 0);
			await beginQuestByTap(page, 0, TOUCH);
			const tiles = await page.locator('.quest-stack').evaluateAll((els) => els.map((el) => {
				const r = el.getBoundingClientRect();
				const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
				return { id: el.dataset.questStack, target: el.dataset.target || '', w: Math.round(r.width), h: Math.round(r.height), hit: !!hit && el.contains(hit) };
			}));
			console.log(`[65-09] quest tiles: ${JSON.stringify(tiles)}`);
			expect(tiles.length, 'the three Quest stacks').toBe(3);
			for (const t of tiles) {
				expect.soft(t.target, `${t.id} carries data-target`).toMatch(/^(valid|invalid)$/);
				expect.soft(t.w, `${t.id} tile width >= 100`).toBeGreaterThanOrEqual(100);
				expect.soft(t.h, `${t.id} tile height >= 44`).toBeGreaterThanOrEqual(44);
				expect.soft(t.hit, `${t.id} answers a tap at its centre`).toBe(true);
			}
			expect(tiles.find((t) => t.id === 'PHYSICAL').target, 'the face-up Physical Quest is choosable').toBe('valid');

			await press(page.locator('.quest-stack[data-quest-stack="PHYSICAL"]'), TOUCH);
			await page.locator('#modal-root .modal-card').first().waitFor({ state: 'visible', timeout: 5000 });
			await page.waitForTimeout(400); // the slide-up finishes
			const sheet = await readSheet(page);
			expect.soft(Math.abs(sheet.bottom - sheet.innerHeight), `the picker is a bottom sheet (bottom ${sheet.bottom} vs ${sheet.innerHeight})`).toBeLessThanOrEqual(1);

			await clickThroughOptions(page, [], 8, TOUCH);
			const after = await getGameState(page);
			expect(mp(after, 'player_1', 0), 'engine: Quest win +25').toBe(before + 25);
			expectQuestShuffledBack(stateBefore, after, 'PHYSICAL');
		});

		test('(f) the toast sits inside the window between the strip and the bar, text uncut', async ({ page }) => {
			const FRESH = "Fresh: can't attack, can't be chosen by opponent cards, ignores Places";
			await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 50, level: 1, entryProtected: true }); // FRESH badge
			await page.waitForTimeout(300);
			await press(page.locator('#zone-player .tile-badge').first(), TOUCH);
			await page.locator('#board-toast').waitFor({ timeout: 3000 });
			await page.waitForTimeout(300); // the 150 ms slide-in is over
			await expect(page.locator('#board-toast')).toHaveText(FRESH);
			await expectInFreeBand(page, '#board-toast');
			const toast = await page.locator('#board-toast').evaluate((el) => {
				const cs = getComputedStyle(el);
				const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
				return { cut: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1, lines: Math.round((el.getBoundingClientRect().height - pad) / parseFloat(cs.lineHeight)) };
			});
			console.log(`[65-09] badge toast: ${JSON.stringify(toast)}`);
			expect.soft(toast.cut, 'the badge toast text is not cut').toBe(false);
			expect.soft(toast.lines, `the badge toast uses the width it has: at most 2 lines (is ${toast.lines})`).toBeLessThanOrEqual(2);
			await press(page.locator('#board-toast'), TOUCH); // a tap dismisses it
			await expect(page.locator('#board-toast')).toHaveCount(0);

			await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 50, level: 1 });
			await tapOwnCard(page, 'mosje', 0, TOUCH);
			await chooseTray(page, 'attack', TOUCH);
			await expect(page.locator('#status-strip')).toHaveAttribute('data-status-kind', 'choose-target');
			const fresh = targetTile(page, 'player_2:1'); // the FRESH Ming: dimmed, with a reason. Tapped low-left: its FRESH pill sits in the middle
			const box = await fresh.boundingBox();
			await fresh.tap({ position: { x: Math.round(box.width * 0.2), y: Math.round(box.height * 0.6) } });
			await page.locator('#board-toast').waitFor({ timeout: 3000 });
			await page.waitForTimeout(300);
			await expect(page.locator('#board-toast')).toHaveText(/^Protected until its owner's next turn$/);
			await expectInFreeBand(page, '#board-toast');
		});

		test('(g) D-12: an opponent Mosje, a Quest tile and Details in a tray open the detail view; Close is 44 px', async ({ page }) => {
			const detail = page.locator('.card-detail');
			const closeAndCheck = async (what) => {
				await expect(detail, `${what} opens the detail view`).toBeVisible({ timeout: 5000 });
				expect.soft(await undersized(page, '#modal-close-preview'), `${what}: Close is at least 44x44`).toEqual([]);
				await press(page.locator('#modal-close-preview'), TOUCH);
				await expect(detail, `${what}: Close closes it`).toHaveCount(0);
			};
			await press(targetTile(page, 'player_2:0'), TOUCH);
			await closeAndCheck('an opponent Mosje tile');
			await press(page.locator('.quest-stack[data-quest-stack="PHYSICAL"]'), TOUCH);
			await closeAndCheck('a Quest tile');
			await tapOwnCard(page, 'mosje', 0, TOUCH);
			await chooseTray(page, 'details', TOUCH);
			await closeAndCheck('Details in the Mosje tray');
			await tapOwnCard(page, 'place', 0, TOUCH);
			await chooseTray(page, 'details', TOUCH);
			await closeAndCheck('Details in the Place tray');
		});

		if (vp.name === '390x844') {
			test('screenshot: the attack preview banner with Confirm / Cancel', async ({ page }) => {
				await openPreview(page);
				await page.waitForTimeout(400);
				fs.mkdirSync(SHOT_DIR, { recursive: true });
				await page.screenshot({ path: `${SHOT_DIR}/65-09-phone-390x844.png` });
			});
		}
	});
}

test.describe('desktop 1920x1080 keeps the tray where it was', () => {
	test.use({ viewport: { width: 1920, height: 1080 } });

	test('a tray open on my Mosje (mouse) for the screenshot', async ({ page }) => {
		test.setTimeout(90000);
		await seedActionsBoard(page);
		await tapOwnCard(page, 'mosje', 1);
		await expect(page.locator('[data-action-tray] [data-action]')).toHaveCount(4);
		await page.mouse.move(2, 2);
		await page.waitForTimeout(400);
		fs.mkdirSync(SHOT_DIR, { recursive: true });
		await page.screenshot({ path: `${SHOT_DIR}/65-09-desktop-1920x1080.png` });
	});
});
