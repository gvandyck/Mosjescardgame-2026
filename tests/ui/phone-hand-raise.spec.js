/**
 * phone-hand-raise.spec.js - Phase 65-06 (MOB-03, MOB-04; D-10, D-12, D-15, D-19 b): on a phone the first tap on a hand card RAISES
 * it and plays nothing. The raised card shows in the bar-sized dock (name, cost or the reason it cannot be played, Details, Play,
 * cancel); the engine's next free slot lights up gold ("Place here") and the Energy crystals preview the spend. Play goes through
 * the existing handlePlayCard; an unplayable card still raises and Play shows the reason as a toast. One card is raised at a time;
 * the dock's cancel, Esc and a tap on the felt cancel; there is no drag and no hover on the phone. Runs at 390x844 and 360x740.
 * (a) proves "nothing plays by accident": 800 ms after the raise the engine hand, Energy and slots are unchanged.
 * Emulation proves the state machine, the taps and where the card lands; only Gandalf's phone proves the feel of the two-step play.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { getGameState, setEnergy } from './helpers.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { rectOf } from '../helpers/phoneGeometry.js';
import { swipe } from '../helpers/phoneSwipe.js';
import { FISSA, KANNETJE, DONER, FREE_SNELLE, RAISE_HAND, wrapOf, hintOf, seedRaiseBoard, raiseCard } from '../helpers/phoneRaise.js';
import { getCardEnergyCost } from '../../src/engine/energy/getCardEnergyCost.js';

const SHOT_DIR = process.env.OBBY65_SHOT_DIR || 'C:/tmp';
const FISSA_COST = getCardEnergyCost(FISSA);
const dockOf = (page) => page.locator('#phone-bar [data-raise-dock]');
const spendGems = (page) => page.locator('#energy-player .energy-gem[data-crystal="spend"]');
const raisedWraps = (page) => page.locator('.hand-card-wrap[data-raised]');

/** The player_1 numbers a play would change: hand size, Energy, Mosje slot 0, Piecie slot 1. */
async function snapshot(page) {
	const p = (await getGameState(page)).players.player_1;
	return { hand: p.hand.length, energy: p.energy, mosje0: p.activeSlots[0]?.cardId ?? null, piecie1: p.piecieSlots[1]?.cardId ?? null };
}

/** A point on the felt: the topmost element is #board-root itself or a plain container (no tile, button, slot, pile or crystal). */
async function feltPoint(page) {
	return page.evaluate(() => {
		const board = document.getElementById('board-root');
		const r = board.getBoundingClientRect();
		const busy = '[data-zone], button, a, .board-slot, .energy-crystals, .pile, [class*="pile"], .quest-stack, .board-place, .board-quest';
		for (let y = r.top + 6; y < r.bottom - 2; y += 6) {
			for (let x = r.left + 4; x < r.right - 2; x += 6) {
				const el = document.elementFromPoint(x, y);
				if (el && board.contains(el) && !el.closest(busy)) return { x, y, el: `${el.tagName.toLowerCase()}.${el.className}` };
			}
		}
		return null;
	});
}

for (const vp of [...PHONE_VIEWPORTS, PIXEL_VIEWPORT]) { // 390x844, 360x740 and Gandalf's Pixel 8 Pro visible size 395x731
	test.describe(`phone tap-raise at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test.beforeEach(async ({ page }) => {
			test.setTimeout(90000);
			await seedRaiseBoard(page);
		});

		test('(a) BUG: the first tap raises the card and plays nothing (800 ms later the engine is unchanged)', async ({ page }) => {
			const before = await snapshot(page);
			expect(before, 'the stage: 5 cards, 6 Energy, both free slots').toEqual({ hand: 5, energy: 6, mosje0: null, piecie1: null });
			await raiseCard(page, FISSA);
			await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'raise');
			await expect(raisedWraps(page)).toHaveCount(1);
			await expect(page.locator('.game-hand-panel'), 'raising closes the drawer').toHaveAttribute('data-drawer', 'closed');
			await page.waitForTimeout(800);
			expect(await snapshot(page), 'nothing played, nothing paid').toEqual(before);
			await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'raise');
		});

		test('(b) the dock shows the name, the cost and 44 px buttons; the engine slot is marked and the crystals preview the spend', async ({ page }) => {
			await raiseCard(page, FISSA);
			const dock = dockOf(page);
			await expect(dock).toBeVisible();
			await expect(dock).toContainText('Alyssa');
			await expect(dock).toContainText(`Costs ${FISSA_COST} Energy`);
			await expect(page.locator('[data-raise-play]')).not.toHaveAttribute('aria-disabled', 'true');
			const bar = await rectOf(page, '#phone-bar');
			for (const sel of ['[data-raise-details]', '[data-raise-play]', '[data-raise-cancel]']) {
				await expect(page.locator(sel), `${sel} exists`).toBeVisible();
				const box = await rectOf(page, sel);
				expect(box.h, `${sel} is at least 44 px high (is ${box.h})`).toBeGreaterThanOrEqual(44);
				expect(box.w, `${sel} is at least 44 px wide (is ${box.w})`).toBeGreaterThanOrEqual(44);
				expect(box.x >= 0 && box.right <= vp.width, `${sel} sits inside the screen width`).toBe(true);
				expect(box.y >= bar.y - 1 && box.bottom <= bar.bottom + 1, `${sel} sits inside the bar`).toBe(true);
			}
			const hint = page.locator('#zone-player [data-place-here]');
			await expect(hint, 'the Mosje slot the engine fills is marked').toHaveCount(1);
			await expect(hint).toHaveAttribute('data-slot-kind', 'mosje');
			await expect(hint).toHaveAttribute('data-slot-index', '0');
			await expect(hintOf(page), 'no other slot is marked').toHaveCount(1);
			await expect(spendGems(page), 'the crystals preview the spend').toHaveCount(FISSA_COST);
		});

		test('(c) Details opens the detail view; closing it leaves the raise active', async ({ page }) => {
			await raiseCard(page, FISSA);
			const detail = page.locator('.card-detail');
			const expectRaiseKept = async (why) => {
				await expect(detail, `${why}: the detail view is closed`).toHaveCount(0);
				await expect(page.locator('#phone-bar'), `${why}: the raise survives the detail view`).toHaveAttribute('data-mode', 'raise');
				await expect(raisedWraps(page)).toHaveCount(1);
				await expect(hintOf(page), `${why}: the hint survives the detail view`).toHaveCount(1);
			};

			await page.locator('[data-raise-details]').tap();
			await expect(detail).toBeVisible();
			await expect(detail).toContainText('Alyssa');
			// Until plan 65-08 sizes the detail view to the phone its Close button sits below the screen edge, so a finger closes it with
			// the dimmed backdrop above the card (the same closePreview handler).
			await page.locator('.modal-backdrop').tap({ position: { x: 20, y: 30 } });
			await expectRaiseKept('backdrop tap');

			// The Close button's own click must not read as "a tap elsewhere" either: its modal is emptied before the document hears the
			// click. Dispatched, because the button cannot be reached by a finger yet (see above).
			await page.locator('[data-raise-details]').tap();
			await expect(detail).toBeVisible();
			await page.locator('#modal-close-preview').dispatchEvent('click');
			await expectRaiseKept('Close button');
		});

		test('(d) Play plays through handlePlayCard: the Mosje lands in the marked slot, Energy is paid, the bar is back to main', async ({ page }) => {
			await raiseCard(page, FISSA);
			await page.locator('[data-raise-play]').tap();
			await expect.poll(async () => (await snapshot(page)).mosje0, 'engine: the Mosje sits in slot 0').toBe(FISSA);
			const after = await snapshot(page);
			expect(after.energy, 'Energy dropped by the cost').toBe(6 - FISSA_COST);
			expect(after.hand, 'the card left the hand').toBe(4);
			await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'main');
			await expect(hintOf(page)).toHaveCount(0);
			await expect(page.locator('[data-place-here-label]')).toHaveCount(0);
			await expect(raisedWraps(page)).toHaveCount(0);
			await expect(spendGems(page)).toHaveCount(0);
		});

		test('(e) an unpayable card raises, shows its reason, Play is aria-disabled and a tap on it toasts the reason', async ({ page }) => {
			await setEnergy(page, 'player_1', 0);
			const before = await snapshot(page);
			await raiseCard(page, FISSA);
			const reason = `Needs ${FISSA_COST} Energy, you have 0`;
			await expect(dockOf(page)).toContainText(reason);
			await expect(page.locator('[data-raise-play]')).toHaveAttribute('aria-disabled', 'true');
			await expect(hintOf(page), 'an unpayable card marks no slot').toHaveCount(0);
			const play = await rectOf(page, '[data-raise-play]');
			expect(play.h, 'a disabled Play is still a 44 px target').toBeGreaterThanOrEqual(44);
			await page.locator('[data-raise-play]').tap({ force: true }); // Playwright treats aria-disabled as "not enabled"; a finger can still tap it
			await expect(page.locator('#board-toast')).toHaveText(reason);
			await page.waitForTimeout(500);
			expect(await snapshot(page), 'nothing played').toEqual(before);
			await expect(page.locator('#phone-bar'), 'the raise stays so the player can read why').toHaveAttribute('data-mode', 'raise');
		});

		test('(f) cancel, switching, Esc and a tap on the felt', async ({ page }) => {
			const before = await snapshot(page);
			await raiseCard(page, FISSA);
			await page.locator('[data-raise-cancel]').tap();
			await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'main');
			await expect(hintOf(page), 'cancel clears the hint').toHaveCount(0);
			await expect(spendGems(page), 'cancel clears the Energy preview').toHaveCount(0);
			await expect(raisedWraps(page)).toHaveCount(0);

			await raiseCard(page, DONER); // reopen the drawer, raise a Piecie: the hint moves to a Piecie slot
			const hint = page.locator('#piecies-player [data-place-here]');
			await expect(hint).toHaveCount(1);
			await expect(hint).toHaveAttribute('data-slot-kind', 'piecie');
			await expect(hint).toHaveAttribute('data-slot-index', '1');
			await expect(page.locator('#zone-player [data-place-here]'), 'no hint on the Mosje row any more').toHaveCount(0);

			await page.keyboard.press('Escape');
			await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'main');
			await expect(hintOf(page)).toHaveCount(0);

			await raiseCard(page, KANNETJE);
			await expect(raisedWraps(page)).toHaveCount(1);
			const felt = await feltPoint(page);
			expect(felt, 'a bare spot of felt exists on the board').not.toBeNull();
			console.log(`[65-06] felt tap at (${Math.round(felt.x)}, ${Math.round(felt.y)}) on ${felt.el}`);
			await page.touchscreen.tap(felt.x, felt.y);
			await expect(page.locator('#phone-bar'), 'a tap on the felt cancels').toHaveAttribute('data-mode', 'main');
			await expect(hintOf(page)).toHaveCount(0);
			await page.waitForTimeout(500);
			expect(await snapshot(page), 'none of that played anything').toEqual(before);
		});

		test('(f2) while a card is raised the Hand button is hidden and a swipe up on the bar does not open the drawer', async ({ page }) => {
			await raiseCard(page, FISSA);
			await expect(page.locator('#phone-hand-toggle'), 'the Hand button hides while a card is raised').toBeHidden();
			await expect(page.locator('#btn-end-turn'), 'End Turn hides too: cancel first').toBeHidden();
			const bar = await rectOf(page, '#phone-bar');
			const y = bar.y + bar.h / 2;
			await swipe(page, { from: { x: vp.width / 2, y }, to: { x: vp.width / 2, y: y - 160 } });
			await page.waitForTimeout(400);
			await expect(page.locator('.game-hand-panel'), 'the drawer stays closed').toHaveAttribute('data-drawer', 'closed');
			await expect(raisedWraps(page), 'still exactly one raised card').toHaveCount(1);
			await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'raise');
		});

		test('(g) no drag, no hover and no browser menu on the phone', async ({ page }) => {
			expect(await page.locator('.hand-card-wrap[draggable="true"]').count(), 'no draggable hand cards on a phone').toBe(0);
			const felt = await feltPoint(page);
			await page.touchscreen.tap(felt.x, felt.y);
			await page.waitForTimeout(300);
			await expect(hintOf(page), 'a plain tap on the board shows no hint').toHaveCount(0);
			const prevented = await page.evaluate(() => {
				const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
				document.querySelector('.hand-card-wrap').dispatchEvent(event);
				return event.defaultPrevented;
			});
			expect(prevented, 'a long-press menu on a hand card is default-prevented').toBe(true);
		});

		test('(h) a Snelle can be raised and marks a Piecie slot', async ({ page }) => {
			await raiseCard(page, FREE_SNELLE);
			await expect(dockOf(page)).toContainText('Je Weet Niet');
			const hint = page.locator('#piecies-player [data-place-here]');
			await expect(hint).toHaveCount(1);
			await expect(hint).toHaveAttribute('data-slot-kind', 'piecie');
			await expect(hint).toHaveAttribute('data-slot-index', '1');
			await expect(page.locator('[data-raise-play]')).not.toHaveAttribute('aria-disabled', 'true');
		});

		test('(i) a re-render between touchstart and click never swallows a tap on the dock', async ({ page }) => {
			await raiseCard(page, FISSA);
			await page.evaluate(() => { document.querySelector('[data-raise-play]').dataset.mark = 'same-node'; });
			await setEnergy(page, 'player_1', 5); // the hook re-renders the whole board and hand: the dock must update in place
			await page.waitForTimeout(300);
			await expect(page.locator('[data-raise-play]'), 'the same Play button survives the re-render').toHaveAttribute('data-mark', 'same-node');
			await expect(hintOf(page), 'the hint is re-applied on the fresh slots').toHaveCount(1);
			await expect(spendGems(page), 'the preview is re-applied on the fresh crystals').toHaveCount(FISSA_COST);
			await page.locator('[data-raise-play]').tap();
			await expect.poll(async () => (await snapshot(page)).mosje0).toBe(FISSA);
			expect((await snapshot(page)).energy).toBe(5 - FISSA_COST);
		});

		test('screenshot: a raised card with its dock and the gold slot', async ({ page }) => {
			await raiseCard(page, FISSA);
			await page.waitForTimeout(400);
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await page.screenshot({ path: `${SHOT_DIR}/65-06-phone-${vp.name}.png` });
		});
	});
}

test.describe('desktop 1920x1080 keeps hover-raise', () => {
	test.use({ viewport: { width: 1920, height: 1080 } });

	test('hovering a hand card still marks the slot; there is no dock and no raise mark', async ({ page }) => {
		test.setTimeout(90000);
		await seedRaiseBoard(page);
		await wrapOf(page, FISSA).hover({ position: { x: 100, y: 30 } });
		await expect(hintOf(page)).toHaveCount(1);
		await expect(page.locator('#phone-bar'), 'the phone bar stays hidden on the desktop').toBeHidden();
		await expect(raisedWraps(page)).toHaveCount(0);
		expect(await page.locator('.hand-card-wrap[draggable="true"]').count(), 'the desktop hand still drags').toBe(RAISE_HAND.length);
		await page.waitForTimeout(400);
		fs.mkdirSync(SHOT_DIR, { recursive: true });
		await page.screenshot({ path: `${SHOT_DIR}/65-06-desktop-1920x1080.png` });
	});
});
