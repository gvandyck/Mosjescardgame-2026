/**
 * phone-hand-drawer.spec.js - Phase 65-03 (MOB-02, MOB-04; D-08, D-09, D-15, D-18, D-19 c): on a touch phone the hand is a
 * drawer behind a thin bottom bar (hand count, Energy, End Turn), closed by default so no card covers your row. It opens by a tap
 * on the Hand button and by a real touch swipe up on the bar (CDP touch events, tests/helpers/phoneSwipe.js); it closes by a tap on
 * the button, a swipe down on the handle, a tap on the board scrim (which must not reach the board) or Esc. A touchcancel mid-swipe
 * changes nothing; a pointercancel mid-swipe does NOT end it (65-03b: real Android Chrome sends one ~15 ms into every drag, then keeps
 * delivering touchmoves and a touchend, so that swipe still opens / closes the drawer). Every hand card is reachable by a sideways
 * swipe. End Turn lives in the bar (>= 44x44,
 * confirm and "N actions left" kept) and goes back to the middle strip on a wide window; the desktop shows no bar at all.
 * Runs at 390x844, 360x740 and the Pixel 8 Pro visible size 395x731 (Gandalf's phone). Emulation proves the layout, the taps and
 * the synthetic swipes; swipe feel, momentum and the Android gesture bar are Gandalf's phone (65-HUMAN-UAT.md).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { getGameState } from './helpers.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { seedPhoneBoard } from '../helpers/phoneBoard.js';
import { rectOf, intersects, undersized, topmostAt } from '../helpers/phoneGeometry.js';
import { swipe } from '../helpers/phoneSwipe.js';

// Seven distinct hand cards: at 140-176 px a card, seven cannot fit a 360-395 px strip, so it has to scroll sideways.
const HAND = ['mosje_alyssa_fissa', 'mosje_gandoe_wizard', 'mosje_ming_natural', 'piecie_kannetje_melk', 'piecie_broodje_doner', 'piecie_momentum_boost', 'place_drain_zone'];
const SHOT_DIR = process.env.OBBY65_SHOT_DIR || 'C:/tmp';
const VIEWPORTS = [...PHONE_VIEWPORTS, PIXEL_VIEWPORT];

const panelOf = (page) => page.locator('.game-hand-panel');
const centre = (box) => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 });

/** The two states of the drawer, asserted by attribute and by what the player sees (closed = hidden, open = ends at the bar). */
async function expectClosed(page, why) {
	await expect(panelOf(page), `${why}: drawer data-drawer`).toHaveAttribute('data-drawer', 'closed');
	await expect(page.locator('#phone-hand-toggle'), `${why}: aria-expanded`).toHaveAttribute('aria-expanded', 'false');
	await expect(panelOf(page), `${why}: the closed drawer is hidden`).toBeHidden();
}
async function expectOpen(page, why) {
	await expect(panelOf(page), `${why}: drawer data-drawer`).toHaveAttribute('data-drawer', 'open');
	await expect(page.locator('#phone-hand-toggle'), `${why}: aria-expanded`).toHaveAttribute('aria-expanded', 'true');
	await expect(panelOf(page), `${why}: the open drawer is visible`).toBeVisible();
	await expect.poll(async () => { // the 220 ms slide has ended once the drawer's bottom sits on the bar's top
		const [p, b] = [await rectOf(page, '.game-hand-panel'), await rectOf(page, '#phone-bar')];
		return Math.abs(p.bottom - b.y);
	}, { message: `${why}: the open drawer ends exactly at the top of the bar`, timeout: 4000 }).toBeLessThanOrEqual(1);
}

/** Every .hand-card-wrap box with whether it can be seen at all (not display none / visibility hidden). */
async function handCards(page) {
	return page.evaluate(() => [...document.querySelectorAll('.hand-card-wrap')].map((el) => {
		const r = el.getBoundingClientRect();
		const cs = getComputedStyle(el);
		const n = (v) => Math.round(v * 10) / 10;
		return { x: n(r.left), y: n(r.top), w: n(r.width), h: n(r.height), right: n(r.right), bottom: n(r.bottom),
			visible: cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && r.height > 0 };
	}));
}

for (const vp of VIEWPORTS) {
	test.describe(`phone hand drawer at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test.beforeEach(async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page, { hand: HAND, energy: 4 });
		});

		test('(a) BUG: with the drawer closed no hand card covers your Mosje or Piecie row', async ({ page }) => {
			const cards = await handCards(page);
			expect(cards.length, 'the seeded hand has 7 cards in the DOM').toBe(7);
			const rows = { '#zone-player': await rectOf(page, '#zone-player'), '#piecies-player': await rectOf(page, '#piecies-player') };
			const hits = [];
			for (const [sel, row] of Object.entries(rows)) {
				cards.forEach((c, i) => { if (c.visible && intersects(c, row)) hits.push(`card ${i} [${c.x},${c.y} ${c.w}x${c.h}] covers ${sel} [${row.x},${row.y} ${row.w}x${row.h}]`); });
			}
			expect(hits, `visible hand cards over the player rows:\n${hits.join('\n')}`).toEqual([]);
		});

		test('(b) a bottom bar shows the hand count and the Energy and holds End Turn (>= 44x44)', async ({ page }) => {
			const bar = await rectOf(page, '#phone-bar');
			expect(bar, '#phone-bar exists').not.toBeNull();
			expect(await page.evaluate(() => getComputedStyle(document.getElementById('phone-bar')).position), 'the bar is fixed').toBe('fixed');
			expect(Math.abs(bar.bottom - vp.height), `the bar's bottom ${bar.bottom} is the window bottom ${vp.height}`).toBeLessThanOrEqual(1);
			expect(bar.h, 'bar height').toBeGreaterThanOrEqual(44);
			expect(bar.x <= 0 && bar.right >= vp.width, 'the bar spans the full width').toBe(true);
			await expect(page.locator('#phone-bar [data-phone-hand-count]')).toHaveText('7');
			await expect(page.locator('#phone-bar [data-phone-energy]')).toHaveText('4/6');
			const end = await rectOf(page, '#phone-bar #btn-end-turn');
			expect(end, '#btn-end-turn is inside #phone-bar').not.toBeNull();
			expect(end.w >= 44 && end.h >= 44, `End Turn is at least 44x44 (is ${end.w}x${end.h})`).toBe(true);
			expect(end.x >= 0 && end.right <= vp.width && end.y >= bar.y && end.bottom <= bar.bottom, 'End Turn sits inside the bar').toBe(true);
			expect(await page.locator('#board-root #btn-end-turn').count(), 'End Turn has left the board').toBe(0);
			expect(await undersized(page, '#phone-bar button')).toEqual([]);
			await expect(page.locator('#phone-bar')).toBeVisible();
		});

		test('(c) the Hand button, the scrim and Esc toggle the drawer; a tap on the scrim never reaches the board', async ({ page }) => {
			await expectClosed(page, 'start');
			await page.locator('#phone-hand-toggle').tap();
			await expectOpen(page, 'after the Hand button');
			const visible = (await handCards(page)).filter((c) => c.visible && c.x >= 0 && c.right <= vp.width && c.y >= 0 && c.bottom <= vp.height);
			expect(visible.length, 'at least one whole hand card is on screen in the open drawer').toBeGreaterThanOrEqual(1);
			await page.locator('#phone-hand-toggle').tap();
			await expectClosed(page, 'after the Hand button again');

			// Esc closes it
			await page.locator('#phone-hand-toggle').tap();
			await expectOpen(page, 'reopened');
			await page.keyboard.press('Escape');
			await expectClosed(page, 'after Esc');

			// A tap on the scrim, over an opponent tile that is above the drawer, closes it and does nothing on the board.
			await page.locator('#phone-hand-toggle').tap();
			await expectOpen(page, 'reopened for the scrim');
			const drawer = await rectOf(page, '.game-hand-panel');
			const at = await page.evaluate((drawerTop) => { // an opponent tile whose centre is on screen, above the drawer
				for (const el of document.querySelectorAll('#zone-opponent [data-zone], #piecies-opponent [data-zone]')) {
					const r = el.getBoundingClientRect();
					const x = r.left + r.width / 2, y = r.top + r.height / 2;
					if (x > 4 && x < innerWidth - 4 && y > 4 && y < drawerTop - 4) return { x, y, zone: el.dataset.zone };
				}
				return null;
			}, drawer.y);
			expect(at, `an opponent tile is on screen above the drawer (top ${drawer.y})`).not.toBeNull();
			expect(await topmostAt(page, at.x, at.y), 'the scrim is the topmost thing over the board').toContain('phone-drawer-scrim');
			await page.touchscreen.tap(at.x, at.y);
			await expectClosed(page, 'after a tap on the scrim');
			await page.waitForTimeout(300);
			expect(await page.locator('[data-action-tray]').count(), 'no action tray opened').toBe(0);
			expect(await page.locator('.is-selected').count(), 'nothing got selected').toBe(0);
			expect(await page.locator('#modal-root.modal-root--open').count(), 'no detail view or other modal opened').toBe(0);
		});

		test('(d) a touch swipe up on the bar opens, a swipe down on the handle closes; short, sideways and cancelled drags do nothing', async ({ page }) => {
			const bar = centre(await rectOf(page, '#phone-bar'));
			// too short, mostly sideways, and cancelled mid-swipe (touchcancel; a pointercancel is NOT a cancel, see (i)): the drawer stays closed
			await swipe(page, { from: bar, to: { x: bar.x, y: bar.y - 20 } });
			await expectClosed(page, 'after a 20 px drag up');
			await swipe(page, { from: { x: bar.x - 50, y: bar.y }, to: { x: bar.x + 50, y: bar.y - 60 } });
			await expectClosed(page, 'after a mostly sideways drag');
			await swipe(page, { from: bar, to: { x: bar.x, y: bar.y - 90 }, cancel: true });
			await expectClosed(page, 'after a swipe that ends in a cancel');
			// the real swipe up
			await swipe(page, { from: bar, to: { x: bar.x, y: bar.y - 90 } });
			await expectOpen(page, 'after a swipe up on the bar');

			const handle = centre(await rectOf(page, '.phone-drawer__handle'));
			await swipe(page, { from: handle, to: { x: handle.x, y: handle.y + 20 } });
			await expectOpen(page, 'after a 20 px drag down on the handle');
			await swipe(page, { from: { x: handle.x - 50, y: handle.y }, to: { x: handle.x + 50, y: handle.y + 60 } });
			await expectOpen(page, 'after a mostly sideways drag on the handle');
			await swipe(page, { from: handle, to: { x: handle.x, y: handle.y + 90 }, cancel: true });
			await expectOpen(page, 'after a cancelled swipe down');
			await swipe(page, { from: handle, to: { x: handle.x, y: handle.y + 90 } });
			await expectClosed(page, 'after a swipe down on the handle');

			// A swipe down that starts on a hand card (the strip pans sideways only) closes it as well. Reopened by swipe, not by tap:
			// after a short synthetic drag Chromium does not turn the NEXT tap into a click (also on a plain header button, so it is
			// the injected input, not this page).
			await swipe(page, { from: bar, to: { x: bar.x, y: bar.y - 90 } });
			await expectOpen(page, 'reopened for the card swipe');
			const card = centre(await rectOf(page, '.hand-card-wrap'));
			await swipe(page, { from: card, to: { x: card.x, y: card.y + 100 } });
			await expectClosed(page, 'after a swipe down that starts on a hand card');
		});

		test('(i) the real Android Chrome swipe: a pointercancel arrives mid-drag, the touch events carry on, the touchend opens / closes the drawer', async ({ page }) => {
			// Measured on Gandalf's Pixel 8 Pro: pointerdown, touchstart, pointermove, touchmove, pointercancel ~15 ms after the first
			// move, ~30 more touchmoves, then a touchend at the final position (no touchcancel). Only touchcancel really cancels.
			await page.evaluate(() => {
				window.__pointerCancels = 0;
				for (const sel of ['#phone-bar', '.phone-drawer__handle']) {
					document.querySelector(sel).addEventListener('pointercancel', () => { window.__pointerCancels++; });
				}
			});
			const firePointerCancel = (sel) => () => page.evaluate((s) => {
				document.querySelector(s).dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, cancelable: false, pointerType: 'touch', isPrimary: true }));
			}, sel);

			const bar = centre(await rectOf(page, '#phone-bar'));
			await swipe(page, { from: bar, to: { x: bar.x, y: bar.y - 90 }, steps: 12, afterFirstMove: firePointerCancel('#phone-bar') });
			expect(await page.evaluate(() => window.__pointerCancels), 'the pointercancel really reached the bar').toBe(1);
			await expectOpen(page, 'after a swipe up on the bar that had a pointercancel mid-drag');

			const handle = centre(await rectOf(page, '.phone-drawer__handle'));
			await swipe(page, { from: handle, to: { x: handle.x, y: handle.y + 90 }, steps: 12, afterFirstMove: firePointerCancel('.phone-drawer__handle') });
			expect(await page.evaluate(() => window.__pointerCancels), 'the pointercancel really reached the handle').toBe(2);
			await expectClosed(page, 'after a swipe down on the handle that had a pointercancel mid-drag');

			// the thresholds still hold under a pointercancel: a 20 px drag is no swipe
			await swipe(page, { from: bar, to: { x: bar.x, y: bar.y - 20 }, steps: 12, afterFirstMove: firePointerCancel('#phone-bar') });
			await expectClosed(page, 'after a 20 px drag up with a pointercancel');
		});

		test('(j) a touchcancel mid-gesture ends it without action: the drawer stays as it was (up on the bar, down on the handle)', async ({ page }) => {
			const bar = centre(await rectOf(page, '#phone-bar'));
			// the finger has already travelled 90 px up when the browser cancels the touch
			await swipe(page, { from: bar, to: { x: bar.x, y: bar.y - 90 }, steps: 12, cancel: true });
			await expectClosed(page, 'after a swipe up on the bar that ends in a touchcancel');
			// a later short drag must not inherit the cancelled gesture's start point
			await swipe(page, { from: bar, to: { x: bar.x, y: bar.y - 20 } });
			await expectClosed(page, 'after a short drag following a touchcancel');

			// reopened by swipe, not by tap: Chromium drops the click of a tap that follows a short synthetic drag (see (d))
			await swipe(page, { from: bar, to: { x: bar.x, y: bar.y - 90 } });
			await expectOpen(page, 'opened by a real swipe up');
			const handle = centre(await rectOf(page, '.phone-drawer__handle'));
			await swipe(page, { from: handle, to: { x: handle.x, y: handle.y + 90 }, steps: 12, cancel: true });
			await expectOpen(page, 'after a swipe down on the handle that ends in a touchcancel');
		});

		test('Android: the bar and the handle take no browser gesture; the bar and the drawer clear the gesture-bar safe area', async ({ page }) => {
			const read = await page.evaluate(() => {
				const ta = (el) => getComputedStyle(el).touchAction;
				return { bar: ta(document.getElementById('phone-bar')), handle: ta(document.querySelector('.phone-drawer__handle')), strip: ta(document.getElementById('hand-root')) };
			});
			// 'none' or 'pinch-zoom': a one-finger vertical drag is no scroll and no pull-to-refresh there (phone-breakpoint.test.ts
			// forbids a literal `touch-action: none` in styles/phone-*.css so pinch-zoom stays allowed; pinch-zoom keeps it).
			expect(read.bar, 'bar touch-action blocks single-finger panning').toMatch(/^(none|pinch-zoom)$/);
			expect(read.handle, 'handle touch-action blocks single-finger panning').toMatch(/^(none|pinch-zoom)$/);
			expect(read.strip, 'the hand strip pans sideways only').toBe('pan-x');

			// A 24 px bottom inset (Android 3-button / gesture bar, home indicator): the bar grows by the inset and pads its content
			// above it, the drawer still ends at the bar's top and the board region still ends there too.
			const inset = 24;
			const cdp = await page.context().newCDPSession(page);
			await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { bottom: inset } });
			await page.waitForTimeout(300);
			const bar = await rectOf(page, '#phone-bar');
			expect(Math.abs(bar.bottom - vp.height), 'the bar still ends at the window bottom').toBeLessThanOrEqual(1);
			expect(bar.h, `the bar grew by the inset (60 + ${inset})`).toBeGreaterThanOrEqual(60 + inset - 1);
			expect(await page.evaluate(() => getComputedStyle(document.getElementById('phone-bar')).paddingBottom), 'the bar pads its bottom by the inset').toBe(`${inset}px`);
			for (const sel of ['#phone-hand-toggle', '#btn-end-turn', '[data-phone-energy]']) {
				const box = await rectOf(page, sel);
				expect(box.bottom <= vp.height - inset + 0.5, `${sel} (bottom ${box.bottom}) sits above the ${inset} px gesture-bar inset`).toBe(true);
			}
			expect((await rectOf(page, '.game-layout')).bottom <= bar.y + 1, 'the board region ends at the top of the bar').toBe(true);
			await page.locator('#phone-hand-toggle').tap();
			await expectOpen(page, 'open with a safe-area inset');
			await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { bottom: 0 } });
			await cdp.detach().catch(() => {});
		});

		test('(e) every hand card is reachable by a sideways swipe in the open drawer, clear of the screen edges', async ({ page }) => {
			await page.locator('#phone-hand-toggle').tap();
			await expectOpen(page, 'open for the strip');
			const m = await page.evaluate(() => {
				const s = document.getElementById('hand-root');
				const cs = getComputedStyle(s);
				return { sw: s.scrollWidth, cw: s.clientWidth, sl: s.scrollLeft, padL: parseFloat(cs.paddingLeft), padR: parseFloat(cs.paddingRight), ox: cs.overflowX };
			});
			expect(m.sw, `the strip scrolls sideways (scrollWidth ${m.sw} > clientWidth ${m.cw})`).toBeGreaterThan(m.cw);
			expect(m.ox, 'overflow-x').toBe('auto');
			expect(m.padL >= 16 && m.padR >= 16, `16 px side padding keeps the first and last card out of the Android Back zone (is ${m.padL} / ${m.padR})`).toBe(true);
			const first = (await handCards(page))[0];
			expect(first.x >= 15, `at rest the first card starts at x ${first.x} (>= 16 from the edge)`).toBe(true);

			const strip = await rectOf(page, '#hand-root');
			const y = strip.y + strip.h / 2;
			await swipe(page, { from: { x: vp.width - 40, y }, to: { x: 40, y } });
			await expect.poll(() => page.evaluate(() => document.getElementById('hand-root').scrollLeft), { message: 'a swipe left scrolls the strip' }).toBeGreaterThan(m.sl + 20);

			const reach = await page.evaluate(() => {
				const s = document.getElementById('hand-root');
				const out = [];
				[...s.querySelectorAll('.hand-card-wrap')].forEach((el, i) => {
					el.scrollIntoView({ inline: 'center', block: 'nearest' });
					const r = el.getBoundingClientRect();
					out.push({ i, left: Math.round(r.left), right: Math.round(r.right) });
				});
				s.scrollLeft = s.scrollWidth;
				const last = s.querySelector('.hand-card-wrap:last-child').getBoundingClientRect();
				return { cards: out, lastRight: Math.round(last.right), innerW: innerWidth };
			});
			expect(reach.cards.length, 'seven cards').toBe(7);
			for (const c of reach.cards) expect(c.left >= 0 && c.right <= reach.innerW, `card ${c.i} can be scrolled fully on screen (x ${c.left}..${c.right} of ${reach.innerW})`).toBe(true);
			expect(reach.lastRight <= reach.innerW - 15, `scrolled to the end the last card ends at ${reach.lastRight}, 16 px inside ${reach.innerW}`).toBe(true);
		});

		test('(f) End Turn in the bar keeps the confirm and the "N actions left" hint, and ends the turn', async ({ page }) => {
			const end = page.locator('#phone-bar #btn-end-turn');
			await expect(end.locator('.end-turn__hint'), 'the actions-left hint is shown while a Mosje can act').toHaveText(/\d+ actions? left/);
			const hint = await rectOf(page, '#phone-bar .end-turn__hint');
			const btn = await rectOf(page, '#phone-bar #btn-end-turn');
			expect(hint.y >= btn.y && hint.bottom <= btn.bottom && hint.x >= btn.x && hint.right <= btn.right, 'the hint sits inside the button').toBe(true);

			await end.tap();
			const confirm = page.locator('.modal-mosje-select-btn[data-id="end"]').first();
			await expect(confirm, 'the "a Mosje can still act" confirm opens').toBeVisible();
			expect((await getGameState(page)).activePlayerId, 'still my turn behind the confirm').toBe('player_1');
			await confirm.tap();

			let sawBot = false;
			await expect.poll(async () => {
				const reaction = page.locator('.modal-card--reaction .modal-mosje-select-btn[data-id="__pass__"]');
				if (await reaction.isVisible().catch(() => false)) await reaction.tap().catch(() => {});
				const draw = page.locator('.modal-mosje-select-btn[data-id="draw"]');
				if (await draw.isVisible().catch(() => false)) await draw.first().tap().catch(() => {});
				const gs = await getGameState(page);
				if (gs.activePlayerId === 'player_2') sawBot = true;
				return sawBot;
			}, { message: 'the turn passed to the bot', timeout: 30000, intervals: [100] }).toBe(true);
		});

		test('(g) a wide window puts End Turn back in the middle strip and hides the bar; the phone size brings it back', async ({ page }) => {
			const parentId = () => page.evaluate(() => document.getElementById('btn-end-turn').parentElement.id);
			expect(await parentId(), 'on the phone End Turn is in the bar').toBe('phone-bar-end-turn');
			await page.setViewportSize({ width: 1280, height: 800 });
			await expect.poll(parentId, { message: 'at 1280x800 End Turn is back in the middle strip' }).toBe('board-end-turn');
			expect(await page.evaluate(() => getComputedStyle(document.getElementById('phone-bar')).display), 'the bar is display none on a wide window').toBe('none');
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await expect.poll(parentId, { message: 'back at the phone size End Turn is in the bar again' }).toBe('phone-bar-end-turn');
			expect(await page.evaluate(() => getComputedStyle(document.getElementById('phone-bar')).display), 'the bar is back').toBe('flex');
			await expectClosed(page, 'after the layout switch');
		});
	});
}

test.describe('(h) desktop 1920x1080 (mouse): no bar, no scrim, no handle, End Turn in the middle strip', () => {
	test.use({ viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false });
	test('the phone-only elements are display none and the hand is visible', async ({ page }) => {
		test.setTimeout(90000);
		await seedPhoneBoard(page, { hand: HAND, energy: 4 });
		const read = await page.evaluate(() => ({
			bar: getComputedStyle(document.getElementById('phone-bar')).display,
			scrim: getComputedStyle(document.getElementById('phone-drawer-scrim')).display,
			handle: getComputedStyle(document.querySelector('.phone-drawer__handle')).display,
			host: document.getElementById('btn-end-turn').parentElement.id,
			panelVisibility: getComputedStyle(document.querySelector('.game-hand-panel')).visibility,
		}));
		expect(read.bar, '#phone-bar').toBe('none');
		expect(read.scrim, 'the scrim').toBe('none');
		expect(read.handle, 'the handle').toBe('none');
		expect(read.host, 'End Turn host').toBe('board-end-turn');
		expect(read.panelVisibility, 'the desktop hand stays visible').toBe('visible');
		expect((await handCards(page)).filter((c) => c.visible).length, 'the desktop hand cards are shown').toBe(7);
	});
});

// Pictures for the progress report (not committed, written outside the repo).
test.describe('65-03 screenshots', () => {
	test.describe('phone 390x844 (touch)', () => {
		test.use(phoneUse(PHONE_VIEWPORTS[0]));
		test('the seeded board with the drawer closed and open', async ({ page }) => {
			test.setTimeout(90000);
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await seedPhoneBoard(page, { hand: HAND, energy: 4 });
			await page.screenshot({ path: `${SHOT_DIR}/65-03-phone-390x844-closed.png` });
			await page.locator('#phone-hand-toggle').tap();
			await expectOpen(page, 'open for the picture');
			await page.screenshot({ path: `${SHOT_DIR}/65-03-phone-390x844.png` });
		});
	});
	test.describe('desktop 1920x1080 (mouse)', () => {
		test.use({ viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false });
		test('the seeded board at 1920x1080', async ({ page }) => {
			test.setTimeout(90000);
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await seedPhoneBoard(page, { hand: HAND, energy: 4 });
			await page.mouse.move(2, 2);
			await page.waitForTimeout(500);
			await page.screenshot({ path: `${SHOT_DIR}/65-03-desktop-1920x1080.png` });
		});
	});
});
