/**
 * phone-place-here.spec.js - Phase 65-07 (MOB-03; D-10, D-11, D-15, D-19 b): while a hand card is raised on a phone, the gold
 * "Place here" slot is never covered and is itself the second way to play. For the Mosje, the Piecie and the Snelle case at
 * 390x844, 360x740 and Gandalf's Pixel 8 Pro (395x731):
 *  (1) exactly one marked slot of the right kind and index, in my row, with one "Place here" label;
 *  (2) the D-11 hit-test: the label is the topmost element at its centre (never the bar, drawer, scrim, hand card, tray or toast);
 *  (3) the geometry, stronger than one point: the whole slot is clear of the bar with a gap of at least 4 px, inside the viewport and
 *      the board, paints inside every clip, and the drawer is shut with no hand card on screen;
 *  (4) the slot is a real touch target (elementFromPoint at its centre, corners and edges answers with the slot);
 *  (5) a tap on the gold slot plays the card through the engine and it lands in the slot that was marked.
 * Further: (6) a tap on any other empty slot cancels and plays nothing; (7) a selected field card and a raised hand card never
 * coexist; (8) a re-render that makes the card unpayable clears the hint and disables Play, and it comes back with the Energy;
 * (9) the z-order safety net (z-index 47, relative) and a desktop guard (the slot stays inert at 1920x1080).
 * Emulation proves the hit-test, the geometry and the taps; only Gandalf's phone proves how the gold slot feels under a thumb.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { getGameState, setEnergy, setHand } from './helpers.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { FISSA, KANNETJE, DONER, JENSEN, wrapOf, hintOf, seedRaiseBoard, raiseCard } from '../helpers/phoneRaise.js';
import { tapOwnCard } from '../helpers/boardTaps.js';
import { readPaintOverflow } from '../helpers/paintOverflow.js';
import { hitTestPlaceHere } from '../helpers/hitTestPlaceHere.js';
import { readPlaceHereGeometry } from '../helpers/readPlaceHereGeometry.js';
import { probeSlotTouch } from '../helpers/probeSlotTouch.js';
import { getCardEnergyCost } from '../../src/engine/energy/getCardEnergyCost.js';

const BLENSEN = 'snelle_blensen'; // Snelle, 4 Energy, stays in its slot until the end of the turn (so its landing slot can be read)
const HAND = [FISSA, DONER, JENSEN, BLENSEN, KANNETJE];
const SHOT_DIR = process.env.OBBY65_SHOT_DIR || 'C:/tmp';

/** The three cases: the card, the slot it must mark, the engine list it lands in and the Energy it really costs. */
const CASES = [
	{ name: 'Mosje', card: FISSA, kind: 'mosje', index: 0, row: '#zone-player', list: 'activeSlots', cost: getCardEnergyCost(FISSA), others: [['piecie', 1], ['piecie', 2]] },
	{ name: 'Piecie', card: DONER, kind: 'piecie', index: 1, row: '#piecies-player', list: 'piecieSlots', cost: 0, others: [['piecie', 2], ['mosje', 0]] },
	{ name: 'Snelle', card: BLENSEN, kind: 'piecie', index: 1, row: '#piecies-player', list: 'piecieSlots', cost: 4, others: [['piecie', 2], ['mosje', 0]] },
];

const spendGems = (page) => page.locator('#energy-player .energy-gem[data-crystal="spend"]');
const raisedWraps = (page) => page.locator('.hand-card-wrap[data-raised]');

/** The numbers a play would change: hand size, Energy and the slots a card could land in. */
async function snapshot(page) {
	const p = (await getGameState(page)).players.player_1;
	return { hand: p.hand.length, energy: p.energy, mosje0: p.activeSlots[0]?.cardId ?? null, piecie1: p.piecieSlots[1]?.cardId ?? null, piecie2: p.piecieSlots[2]?.cardId ?? null };
}

/** A finger on the middle of an empty own slot: touchscreen.tap, because an inert slot is not a tappable target for locator.tap(). */
async function tapSlotCentre(page, kind, index) {
	const row = kind === 'mosje' ? '#zone-player' : '#piecies-player';
	const box = await page.locator(`${row} .board-slot--empty[data-slot-kind="${kind}"][data-slot-index="${index}"]`).boundingBox();
	expect(box, `the empty ${kind} slot ${index} exists`).not.toBeNull();
	await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

/** Seed the full board, then the five-card hand with a Mosje, a Piecie and two Snelles. */
async function seedPlaceBoard(page) {
	await seedRaiseBoard(page);
	await setHand(page, 'player_1', HAND);
	await page.waitForTimeout(400);
}

for (const vp of [...PHONE_VIEWPORTS, PIXEL_VIEWPORT]) { // 390x844, 360x740 and the Pixel 8 Pro visible size 395x731
	test.describe(`phone Place here at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test.beforeEach(async ({ page }) => {
			test.setTimeout(90000);
			await seedPlaceBoard(page);
		});

		for (const c of CASES) {
			test(`${c.name} case (1)-(4): one marked ${c.kind} slot ${c.index}, label topmost, clear of the bar by >= 4 px, a real touch target`, async ({ page }) => {
				await raiseCard(page, c.card);
				await page.waitForTimeout(300);

				// (1) exactly one marked slot, the right one, in my row, with one label
				await expect(hintOf(page), 'exactly one marked slot').toHaveCount(1);
				await expect(hintOf(page)).toHaveAttribute('data-slot-kind', c.kind);
				await expect(hintOf(page)).toHaveAttribute('data-slot-index', String(c.index));
				expect(await hintOf(page).evaluate((el, row) => !!el.closest(row), c.row), 'inside my row').toBe(true);
				await expect(page.locator('[data-place-here-label]'), 'exactly one label').toHaveCount(1);
				await expect(page.locator('[data-place-here-label]')).toHaveText('Place here');

				// (2) D-11 hit-test
				const hit = await hitTestPlaceHere(page);
				// (3) geometry
				const geo = await readPlaceHereGeometry(page);
				console.log(`[65 D-11] ${c.name} ${vp.name}: ${JSON.stringify({ hit, gap: geo?.gap, slot: geo?.slot, bar: geo?.bar, layers: geo?.layers })}`);
				expect(hit.ok, `"Place here" must be the topmost element at its centre: ${JSON.stringify(hit)}`).toBe(true);
				expect(geo, 'a marked slot to measure').not.toBeNull();
				expect(geo.overlapsBar, `the slot box must not touch the bar: ${JSON.stringify({ slot: geo.slot, bar: geo.bar })}`).toBe(false);
				expect(geo.gap, `a clear strip of at least 4 px between the slot bottom and the bar top (is ${geo.gap})`).toBeGreaterThanOrEqual(4);
				expect(geo.inViewport, `slot and label inside the ${vp.name} viewport: ${JSON.stringify(geo.slot)}`).toBe(true);
				expect(geo.inBoard, `slot and label inside the board: ${JSON.stringify({ slot: geo.slot, board: geo.board })}`).toBe(true);
				expect(geo.layers, 'no drawer, scrim, tray or toast over the slot').toEqual([]);
				expect(await readPaintOverflow(page, '[data-place-here]'), 'the gold frame and glow paint inside every clip').toEqual([]);
				expect(geo.drawer, 'the drawer is closed while a card is raised').toBe('closed');
				expect(geo.visibleHandCards, 'no hand card on screen').toBe(0);
				await expect(page.locator('.hand-card-wrap:visible')).toHaveCount(0);

				// (4) a real touch target (D-15): the slot answers at its centre, its corners and its edges
				expect(await probeSlotTouch(page), 'every probed point lands on the marked slot').toEqual([]);
				expect(geo.slot.w, 'the slot is at least 44 px wide').toBeGreaterThanOrEqual(44);
				expect(geo.slot.h, 'the slot is at least 44 px high').toBeGreaterThanOrEqual(44);
			});

			test(`${c.name} case (5): a tap on the gold slot plays the card and it lands in the marked slot`, async ({ page }) => {
				const before = await snapshot(page);
				expect(before.energy, 'the stage: 6 Energy').toBe(6);
				await raiseCard(page, c.card);
				await expect(hintOf(page)).toHaveCount(1);
				await expect(spendGems(page), 'the crystals preview the real cost').toHaveCount(c.cost);
				await hintOf(page).tap({ timeout: 8000 }); // a slot that is still inert fails here in 8 s, not at the test timeout
				await expect.poll(async () => (await getGameState(page)).players.player_1[c.list][c.index]?.cardId, `engine: ${c.card} sits in the marked slot`).toBe(c.card);
				const after = await snapshot(page);
				expect(after.energy, `Energy dropped by the real cost (${c.cost})`).toBe(before.energy - c.cost);
				expect(after.hand, 'the card left the hand').toBe(before.hand - 1);
				await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'main');
				await expect(hintOf(page), 'no [data-place-here] left').toHaveCount(0);
				await expect(page.locator('[data-place-here-label]'), 'no label left').toHaveCount(0);
				await expect(raisedWraps(page), 'no [data-raised] left').toHaveCount(0);
				await expect(page.locator('[data-raise-dock] > *'), 'the dock is empty again').toHaveCount(0);
			});

			test(`${c.name} case (6): a tap on any other empty slot cancels the raise and plays nothing`, async ({ page }) => {
				const before = await snapshot(page);
				for (const [kind, index] of c.others) {
					await raiseCard(page, c.card);
					await expect(hintOf(page)).toHaveCount(1);
					await tapSlotCentre(page, kind, index);
					await expect(page.locator('#phone-bar'), `a tap on empty ${kind} slot ${index} cancels`).toHaveAttribute('data-mode', 'main');
					await expect(hintOf(page)).toHaveCount(0);
					await expect(raisedWraps(page)).toHaveCount(0);
					await page.waitForTimeout(300);
					expect(await snapshot(page), `nothing played by a tap on empty ${kind} slot ${index}`).toEqual(before);
				}
			});
		}

		test('(7) a selected field card and a raised hand card never coexist', async ({ page }) => {
			const tray = page.locator('[data-action-tray]');
			await tapOwnCard(page, 'mosje', 1, { touch: true });
			await expect(tray, 'the field card is selected: its tray is open').toHaveCount(1);
			await raiseCard(page, FISSA);
			await expect(tray, 'raising a hand card closes the tray').toHaveCount(0);
			await expect(raisedWraps(page)).toHaveCount(1);
			await expect(hintOf(page)).toHaveCount(1);

			await tapOwnCard(page, 'mosje', 1, { touch: true }); // the other way round: selecting a field card ends the raise
			await expect(tray).toHaveCount(1);
			await expect(raisedWraps(page), 'the raise is gone').toHaveCount(0);
			await expect(hintOf(page), 'and its hint with it').toHaveCount(0);
			await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'main');
		});

		test('(8) a re-render that makes the raised card unpayable clears the hint and disables Play; the Energy brings it back', async ({ page }) => {
			const cost = getCardEnergyCost(FISSA);
			await raiseCard(page, FISSA);
			await expect(hintOf(page)).toHaveCount(1);
			await expect(spendGems(page)).toHaveCount(cost);

			await setEnergy(page, 'player_1', 0); // the hook re-renders the hand and rebuilds every board slot
			await expect(hintOf(page), 'the hint disappears').toHaveCount(0);
			await expect(page.locator('[data-place-here-label]')).toHaveCount(0);
			await expect(page.locator('[data-raise-play]'), 'Play is aria-disabled').toHaveAttribute('aria-disabled', 'true');
			await expect(page.locator('#phone-bar [data-raise-dock]'), 'the dock line shows the reason').toContainText(`Needs ${cost} Energy, you have 0`);
			await expect(spendGems(page), 'the Energy preview clears').toHaveCount(0);

			await setEnergy(page, 'player_1', 6);
			await expect(hintOf(page), 'the hint survives the board rebuild and returns with the Energy').toHaveCount(1);
			await expect(page.locator('[data-raise-play]')).not.toHaveAttribute('aria-disabled', 'true');
			await expect(spendGems(page)).toHaveCount(cost);
			const hit = await hitTestPlaceHere(page);
			expect(hit.ok, `the restored label is still topmost: ${JSON.stringify(hit)}`).toBe(true);
		});

		test('(9) the z-order safety net stays and the marked slot takes touch', async ({ page }) => {
			await raiseCard(page, FISSA);
			const css = await hintOf(page).evaluate((el) => {
				const cs = getComputedStyle(el);
				return { zIndex: cs.zIndex, position: cs.position, pointerEvents: cs.pointerEvents, cursor: cs.cursor, border: cs.borderTopColor, animation: cs.animationName };
			});
			expect(css.zIndex, 'slot 47 above the bar 46 and the hand panel 45').toBe('47');
			expect(css.position).toBe('relative');
			expect(css.pointerEvents, 'the marked slot answers to touch on the phone').toBe('auto');
			expect(css.cursor).toBe('pointer');
			expect(css.border, 'still the gold accent').toBe('rgb(232, 185, 79)');
			expect(css.animation, 'still a static glow').toBe('none');
			const label = await page.locator('[data-place-here-label]').evaluate((el) => getComputedStyle(el).pointerEvents);
			expect(label, 'the label stays pointer-events none, so the tap lands on the slot').toBe('none');
			const others = await page.locator('#board-root .board-slot--empty:not([data-place-here])').evaluateAll((els) => els.map((el) => getComputedStyle(el).pointerEvents));
			expect(others.length, 'there are other empty slots').toBeGreaterThan(0);
			expect(others.every((pe) => pe === 'none'), 'every other empty slot stays inert').toBe(true);
		});

		if (vp.name === '390x844') {
			test('screenshot: the gold slot and the raise dock', async ({ page }) => {
				await raiseCard(page, FISSA);
				await page.waitForTimeout(400);
				fs.mkdirSync(SHOT_DIR, { recursive: true });
				await page.screenshot({ path: `${SHOT_DIR}/65-07-phone-390x844.png` });
			});
		}
	});
}

test.describe('desktop 1920x1080 keeps the inert slot', () => {
	test.use({ viewport: { width: 1920, height: 1080 } });

	test('the hovered hand card marks the slot, the slot stays inert and the label is topmost', async ({ page }) => {
		test.setTimeout(90000);
		await seedPlaceBoard(page);
		await wrapOf(page, FISSA).hover({ position: { x: 100, y: 30 } });
		await expect(hintOf(page)).toHaveCount(1);
		await page.waitForTimeout(500);
		expect(await hintOf(page).evaluate((el) => getComputedStyle(el).pointerEvents), 'desktop: the slot stays inert (64.1)').toBe('none');
		const hit = await hitTestPlaceHere(page);
		expect(hit.ok, `desktop: the label is topmost: ${JSON.stringify(hit)}`).toBe(true);
		fs.mkdirSync(SHOT_DIR, { recursive: true });
		await page.screenshot({ path: `${SHOT_DIR}/65-07-desktop-1920x1080.png` });
	});
});
