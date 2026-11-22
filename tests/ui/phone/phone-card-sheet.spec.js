/**
 * phone-card-sheet.spec.js - Phase 72.1-06 (D-06, D-04, D-12, D-13; MOB-05): the hover dock has a phone form, ONE bottom sheet. A long
 * press (500 ms) on any face-up table card (Mosje, Piecie, Place, Quest), on a hand card, or a tap on the count badge opens it with
 * what only the dock showed: type line, Level / MP / Power, "Attachments n / max", the FULL timed-effect texts, the card panel. It
 * closes by a tap on the backdrop, a swipe down of the handle (60 px or more), Escape or its Close button, never plays or pays, is at
 * most 70 dvh tall, never covers a "Place here" slot (a raise closes first) and shows nothing of the opponent's hand. Desktop: the
 * hover dock stays, no sheet exists, a mouse hold opens nothing. 395x731, 390x844, 360x740, real CDP touches, headless.
 * One screenshot at 395x731 (72.1-06-card-sheet.png).
 */
import { test, expect } from '@playwright/test';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { seedTileState, OWN_TILE, OPP_TILE, TIMED_TEXT } from '../../helpers/phoneTileState.js';
import { seedRaiseBoard, raiseCard, openDrawer, wrapOf, hintOf, FISSA, KANNETJE, FREE_SNELLE } from '../../helpers/phoneRaise.js';
import { seedPhoneBoard } from '../../helpers/phoneBoard.js';
import { longPress } from '../../helpers/phoneLongPress.js';
import { swipe } from '../../helpers/phoneSwipe.js';
import { savePhoneShot } from '../../helpers/savePhoneShot.js';

const SHEET = '.phone-sheet';
const sheet = (page) => page.locator(SHEET);

async function centerOf(page, selector) {
	const loc = page.locator(selector).first();
	await loc.scrollIntoViewIfNeeded();
	const box = await loc.boundingBox();
	return { x: box.x + box.width / 2, y: box.y + box.height * 0.35 }; // over the art, above the count badge
}

const holdOn = async (page, selector) => longPress(page, { at: await centerOf(page, selector), holdMs: 600 });

const cardName = (page, id) => page.evaluate(async (cardId) => (await import('/src/data/cardIndex.js')).getCardById(cardId).name, id);

/** What a play or a payment would change. */
const snapshot = (page) => page.evaluate(() => {
	const p = window.__testHooks.getGameState().players.player_1;
	return { hand: p.hand.length, energy: p.energy, mosje0: p.activeSlots[0]?.cardId ?? null, piecie1: p.piecieSlots[1]?.cardId ?? null };
});

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone card sheet at ${vp.name}`, () => {
		test.use(phoneUse(vp));

		test('(a) a long press on my Mosje with gear and an effect opens the sheet with attachments n / max and the effect text', async ({ page }) => {
			test.setTimeout(90000);
			await seedTileState(page);
			await holdOn(page, OWN_TILE);
			await expect(sheet(page)).toBeVisible();
			await expect(sheet(page)).toContainText('Attachments 2 / 2');
			await expect(sheet(page)).toContainText('Dumbbells');
			await expect(sheet(page)).toContainText('Keyboard');
			await expect(sheet(page)).toContainText(TIMED_TEXT);
			await expect(sheet(page)).toContainText('Level 1');
			await expect(sheet(page)).toContainText('50 MP');
			expect(await page.locator('#modal-root .phone-sheet').count(), 'the sheet root sits outside #modal-root').toBe(0);
			expect(await page.locator('#phone-sheet-root .phone-sheet').count()).toBe(1);
			await page.waitForTimeout(900); // the swallowed click must not close it or open the tray
			await expect(sheet(page)).toBeVisible();
			await expect(page.locator('[data-action-tray]')).toHaveCount(0);
			if (vp.name === PIXEL_VIEWPORT.name) await savePhoneShot(page, '72.1-06-card-sheet');
		});

		test('(b) the opponent Mosje, a Piecie, the Place and a Quest open the sheet for their own card', async ({ page }) => {
			test.setTimeout(120000);
			await seedTileState(page);
			await page.evaluate(() => window.__testHooks.setActivePlace('place_drain_zone', 'player_1'));
			await page.waitForTimeout(500);
			const quest = await page.locator('#quest-stacks .quest-stack[data-quest]').first().getAttribute('data-quest');
			const cases = [
				['opponent Mosje', OPP_TILE, 'mosje_gandoe_wizard'],
				['own Piecie', '#piecies-player .card[data-card-id="piecie_broodje_doner"]', 'piecie_broodje_doner'],
				['opponent Piecie', '#piecies-opponent .card[data-card-id="piecie_broodje_doner"]', 'piecie_broodje_doner'],
				['Place', '#board-place [data-zone="place"]', 'place_drain_zone'],
				['Quest', '#quest-stacks .quest-stack[data-quest]', quest],
			];
			for (const [label, selector, id] of cases) {
				await holdOn(page, selector);
				await expect(sheet(page), `${label}: the sheet opens`).toBeVisible();
				await expect(page.locator('.phone-sheet__title'), `${label}: the title is the card name`).toContainText(await cardName(page, id));
				await page.locator('.phone-sheet__close').tap();
				await expect(sheet(page)).toHaveCount(0);
			}
		});

		test('(c) a long press on a hand card opens the sheet (not Details) and plays nothing', async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page, { hand: [FISSA, KANNETJE, FREE_SNELLE], energy: 6 });
			await openDrawer(page);
			const before = await snapshot(page);
			await wrapOf(page, FISSA).scrollIntoViewIfNeeded();
			const box = await wrapOf(page, FISSA).locator('.hand-card').first().boundingBox();
			await longPress(page, { at: { x: box.x + box.width / 2, y: box.y + box.height / 2 }, holdMs: 600 });
			await expect(sheet(page)).toBeVisible();
			await expect(page.locator('.phone-sheet__title')).toContainText(await cardName(page, FISSA));
			await expect(page.locator('.card-detail'), 'the long press no longer opens Details').toHaveCount(0);
			await page.waitForTimeout(900);
			await expect(page.locator('.hand-card-wrap[data-raised]')).toHaveCount(0);
			expect(await snapshot(page), 'nothing played, nothing paid').toEqual(before);
		});

		test('(d) a tap on the count badge opens the sheet for that Mosje', async ({ page }) => {
			test.setTimeout(90000);
			await seedTileState(page);
			await page.locator(`${OWN_TILE} .tile-count-badge`).tap();
			await expect(sheet(page)).toBeVisible();
			await expect(sheet(page)).toContainText('Attachments 2 / 2');
			await expect(page.locator('[data-action-tray]'), 'the badge tap did not open the tray').toHaveCount(0);
		});

		test('(e) handle, Close and Full card are real touch targets; Full card opens the detail view', async ({ page }) => {
			test.setTimeout(90000);
			await seedTileState(page);
			await holdOn(page, OWN_TILE);
			await expect(sheet(page)).toBeVisible();
			await expect(page.locator('.phone-sheet__handle')).toBeVisible();
			for (const sel of ['.phone-sheet__close', '.phone-sheet__action']) {
				const box = await page.locator(sel).first().boundingBox();
				expect(box.width, `${sel} width`).toBeGreaterThanOrEqual(43.5);
				expect(box.height, `${sel} height`).toBeGreaterThanOrEqual(43.5);
			}
			const handle = await page.locator('.phone-sheet__top').boundingBox();
			expect(handle.height, 'the swipe area is at least 44 px tall').toBeGreaterThanOrEqual(43.5);
			await expect(page.locator('.phone-sheet__action').first()).toHaveText('Full card');
			await page.locator('.phone-sheet__action').first().tap();
			await expect(page.locator('.card-detail')).toBeVisible();
			await expect(page.locator('.card-detail')).toContainText('Attachments 2 / 2');
			await expect(sheet(page), 'Full card closes the sheet').toHaveCount(0);
		});

		test('(f) a tap on the backdrop, Escape and the Close button close it; a swipe down of 100 px closes it, 20 px does not', async ({ page }) => {
			test.setTimeout(120000);
			await seedTileState(page);

			await holdOn(page, OWN_TILE);
			await expect(sheet(page)).toBeVisible();
			await page.waitForTimeout(500);
			await page.touchscreen.tap(vp.width / 2, 70); // the strip above the sheet
			await expect(sheet(page), 'backdrop tap').toHaveCount(0);

			await holdOn(page, OWN_TILE);
			await expect(sheet(page)).toBeVisible();
			await page.keyboard.press('Escape');
			await expect(sheet(page), 'Escape').toHaveCount(0);

			await holdOn(page, OWN_TILE);
			await expect(sheet(page)).toBeVisible();
			await page.locator('.phone-sheet__close').tap();
			await expect(sheet(page), 'Close button').toHaveCount(0);

			await holdOn(page, OWN_TILE);
			await expect(sheet(page)).toBeVisible();
			await page.waitForTimeout(400); // the slide-up is over
			const grip = await page.locator('.phone-sheet__handle').boundingBox();
			const from = { x: grip.x + grip.width / 2, y: grip.y + grip.height / 2 };
			await swipe(page, { from, to: { x: from.x, y: from.y + 20 } });
			await page.waitForTimeout(300);
			await expect(sheet(page), 'a 20 px swipe does not close it').toBeVisible();
			await swipe(page, { from, to: { x: from.x, y: from.y + 100 } });
			await expect(sheet(page), 'swipe down of 100 px').toHaveCount(0);
		});

		test('(g) it never plays or pays; a raise closes first and the Place here slot is never covered', async ({ page }) => {
			test.setTimeout(120000);
			await seedRaiseBoard(page, { energy: 6 });
			await raiseCard(page, FISSA);
			await expect(hintOf(page).first()).toBeVisible();
			const before = await snapshot(page);
			await holdOn(page, '#zone-player [data-zone="mosje"][data-slot-index="1"]');
			await expect(sheet(page)).toBeVisible();
			await expect(page.locator('#phone-bar'), 'the raise closed').not.toHaveAttribute('data-mode', 'raise');
			await expect(hintOf(page), 'no slot is marked while the sheet is open').toHaveCount(0);
			expect(await snapshot(page), 'nothing played, nothing paid').toEqual(before);
		});

		test('(h) at most 70 dvh tall, long content scrolls inside it, the page never scrolls', async ({ page }) => {
			test.setTimeout(90000);
			await seedTileState(page);
			await page.evaluate(() => {
				for (let i = 0; i < 6; i++) window.__testHooks.addTimedEffect('player_1', 0, { kind: 'power', amount: 10 + i * 5, duration: 'untilEndOfYourNextTurn' });
			});
			await page.waitForTimeout(500);
			await holdOn(page, OWN_TILE);
			await expect(sheet(page)).toBeVisible();
			await page.waitForTimeout(400);
			const m = await page.evaluate(() => {
				const s = document.querySelector('.phone-sheet');
				const body = s.querySelector('.phone-sheet__body');
				const r = s.getBoundingClientRect();
				const doc = document.scrollingElement;
				return { h: r.height, bottom: r.bottom, ih: window.innerHeight, bodyScroll: body.scrollHeight, bodyClient: body.clientHeight, docScroll: doc.scrollHeight, scrollTop: doc.scrollTop, right: r.right, left: r.left, iw: window.innerWidth };
			});
			expect(m.h, 'at most 70 dvh').toBeLessThanOrEqual(m.ih * 0.7 + 1);
			expect(Math.abs(m.bottom - m.ih), 'the sheet ends on the screen bottom').toBeLessThanOrEqual(1);
			expect(m.left).toBeGreaterThanOrEqual(0);
			expect(m.right).toBeLessThanOrEqual(m.iw);
			expect(m.bodyScroll, 'the body is the scroller').toBeGreaterThanOrEqual(m.bodyClient);
			expect(m.docScroll, 'the page itself does not scroll').toBeLessThanOrEqual(m.ih);
			expect(m.scrollTop).toBe(0);
			await expect(page.locator('.phone-sheet__close'), 'Close stays reachable').toBeInViewport();
		});

		test('(i) the sheet shows nothing of the opponent hand', async ({ page }) => {
			test.setTimeout(90000);
			await seedTileState(page);
			await page.evaluate(() => window.__testHooks.setHand('player_2', ['snelle_jeweetniet']));
			await page.waitForTimeout(400);
			const secret = await cardName(page, 'snelle_jeweetniet');
			await holdOn(page, OPP_TILE);
			await expect(sheet(page)).toBeVisible();
			expect(await sheet(page).innerText()).not.toContain(secret);
		});
	});
}

test.describe('desktop guard: the hover dock stays, no sheet, a mouse hold opens nothing', () => {
	test.use({ viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false });

	test('1920x1080: hovering a field card shows the dock; no .phone-sheet exists; a 700 ms mouse hold opens none', async ({ page }) => {
		test.setTimeout(90000);
		await seedTileState(page);
		const tile = page.locator(OWN_TILE);
		await tile.hover();
		await expect(page.locator('.hover-zoom')).toHaveCount(1);
		await expect(page.locator(SHEET)).toHaveCount(0);
		const box = await tile.boundingBox();
		await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.35);
		await page.mouse.down();
		await page.waitForTimeout(700);
		await page.mouse.up();
		await page.waitForTimeout(300);
		await expect(page.locator(SHEET)).toHaveCount(0);
		expect(await page.locator('#phone-sheet-root .phone-sheet').count()).toBe(0);
	});
});
