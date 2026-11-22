/**
 * phone-reactions-banners.spec.js - Phase 72.1-09 (D-04, D-06, MOB-04, MOB-05): the moments that interrupt a turn read on a phone, at
 * 395x731, 390x844 and 360x740. (1) The activation chip (cast chip) of the left-most, right-most and opponent tiles stays inside
 * the screen with 8 px margins, is at least 12 px, takes no tap and never covers a bar button. (2) A bot attack with a playable
 * Snelle opens the reaction window as a bottom sheet: full width, at most 78 dvh, the context line whole, option rows >= 48 px
 * and inside the window, "No reaction" reachable, and the board visible above. (3) The Place banner, turn banner, deck-out banner
 * and toast fit with no sideways overflow and take no tap; End Turn and the drawer handle stay tappable under them. (4) The
 * spotlight is centred, clear of the strip and the bar, and takes no tap. A desktop guard keeps the chip centred under its card.
 */
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setHand, setEnergy } from '../helpers.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { seedPhoneTurnBoard } from '../../helpers/phoneTurnBoard.js';
import { freezeAnimations, seedBannerBoard, castChipOn, boxOf } from '../../helpers/phoneBannerCases.js';
import { savePhoneShot } from '../../helpers/savePhoneShot.js';

const VIEWPORTS = [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS];

async function boot(page) {
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
}

for (const vp of VIEWPORTS) {
	test.describe(`phone reactions and banners at ${vp.name}`, () => {
		test.use(phoneUse(vp));

		test('the activation chip stays on screen and off the bar', async ({ page }) => {
			test.setTimeout(90000);
			await boot(page);
			await seedBannerBoard(page);
			for (const [pid, slot] of [['player_1', 0], ['player_1', 1], ['player_2', 0], ['player_2', 1]]) {
				const c = await castChipOn(page, pid, slot);
				console.log(`[72.1-09] ${vp.name} chip ${pid}:${slot} ${JSON.stringify(c)}`);
				expect(c, `${pid}:${slot}: a chip appeared`).not.toBeNull();
				expect.soft(c.left, `${pid}:${slot}: left edge >= 8`).toBeGreaterThanOrEqual(7.5);
				expect.soft(c.right, `${pid}:${slot}: right edge <= width - 8`).toBeLessThanOrEqual(c.vw - 7.5);
				expect.soft(c.top, `${pid}:${slot}: top on screen`).toBeGreaterThanOrEqual(0);
				expect.soft(c.bottom, `${pid}:${slot}: bottom on screen`).toBeLessThanOrEqual(c.vh);
				expect.soft(c.barHits, `${pid}:${slot}: not over a bar button`).toBe(0);
				expect.soft(c.font, `${pid}:${slot}: text >= 12 px`).toBeGreaterThanOrEqual(12);
				expect.soft(c.pe).toBe('none');
				await page.evaluate(() => document.querySelectorAll('.cast-chip').forEach((e) => e.remove()));
			}
		});

		test('a reaction window is a bottom sheet with every option reachable', async ({ page }) => {
			test.setTimeout(90000);
			await boot(page);
			await seedPhoneTurnBoard(page);
			await setHand(page, 'player_1', ['snelle_the_protector']);
			await setEnergy(page, 'player_1', 6);
			const before = (await getGameState(page)).players.player_1.activeSlots[0].mp;
			expect(await page.evaluate(() => window.__testHooks.botAttack(0, 0))).toBe('ok');
			const prompt = page.locator('.modal-card--reaction');
			await expect(prompt).toBeVisible({ timeout: 8000 });
			await page.waitForTimeout(500);
			const m = await page.evaluate(() => {
				const card = document.querySelector('.modal-card--reaction');
				const r = card.getBoundingClientRect();
				const ctx = card.querySelector(':scope > p');
				const rows = [...card.querySelectorAll('.modal-mosje-select-btn')].map((b) => { const q = b.getBoundingClientRect(); return { id: b.dataset.id, top: q.top, bottom: q.bottom, left: q.left, right: q.right, h: q.height }; });
				return {
					vw: innerWidth, vh: innerHeight, left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height,
					ctxClipped: ctx ? ctx.scrollHeight > ctx.clientHeight + 1 : null, ctxText: ctx?.textContent, rows,
					cardScroll: card.scrollHeight - card.clientHeight,
				};
			});
			console.log(`[72.1-09] ${vp.name} reaction ${JSON.stringify(m)}`);
			expect.soft(Math.abs(m.bottom - m.vh), 'sheet ends on the window bottom').toBeLessThanOrEqual(1);
			expect.soft(m.left, 'full width (left)').toBeLessThanOrEqual(1);
			expect.soft(m.right, 'full width (right)').toBeGreaterThanOrEqual(m.vw - 1);
			expect.soft(m.height, 'at most 78 dvh').toBeLessThanOrEqual(m.vh * 0.78 + 1);
			expect.soft(m.top, 'the board shows above the sheet').toBeGreaterThanOrEqual(m.vh * 0.2);
			expect.soft(m.ctxClipped, `context line whole: ${m.ctxText}`).toBe(false);
			expect(m.rows.length).toBeGreaterThanOrEqual(2);
			for (const r of m.rows) {
				expect.soft(r.h, `${r.id}: row >= 48 px`).toBeGreaterThanOrEqual(47.5);
				expect.soft(r.top, `${r.id}: row inside window (top)`).toBeGreaterThanOrEqual(0);
				expect.soft(r.bottom, `${r.id}: row inside window (bottom)`).toBeLessThanOrEqual(m.vh + 0.5);
				expect.soft(r.left).toBeGreaterThanOrEqual(0);
				expect.soft(r.right).toBeLessThanOrEqual(m.vw + 0.5);
			}
			expect(m.rows.some((r) => r.id === '__pass__'), 'No reaction is there').toBe(true);
			expect.soft(m.cardScroll, 'nothing to scroll with up to 3 options').toBeLessThanOrEqual(1);
			if (vp.name === '395x731') await savePhoneShot(page, '72.1-09-reaction');
			await prompt.locator('.modal-mosje-select-btn[data-id="__pass__"]').tap();
			await expect.poll(async () => { const g = await getGameState(page); return g.pendingReaction == null && g.activePlayerId === 'player_1'; }, { timeout: 15000 }).toBe(true);
			expect((await getGameState(page)).players.player_1.activeSlots[0].mp, 'No reaction: the full loss').toBeLessThan(before);
		});

		test('Place, turn, deck-out banners and the toast fit and never block a tap', async ({ page }) => {
			test.setTimeout(90000);
			await boot(page);
			await seedBannerBoard(page);
			await freezeAnimations(page);
			await page.evaluate(async () => {
				const a = await import('/src/ui/actionAnimations.js');
				const b = await import('/src/ui/boardRenderer.js');
				const t = await import('/src/ui/board/showToast.js');
				b.showPlaceEffectBanner('Synergy Chamber of the Long Named Hallway', 'Every Mosje on your field gains 5 MP at the start of your turn (test text).', 'start');
				a.showTurnTransition({ playerName: 'TestPlayerWithALongName', turnNumber: 12, type: 'start' });
				a.showDeckOutBanner({ playerName: 'TestPlayerWithALongName' });
				t.showToast('Fresh: this Mosje arrived this turn and cannot act until your next turn begins.');
			});
			await page.waitForTimeout(300);
			for (const sel of ['.place-effect-banner', '.turn-transition', '.deckout-banner', '#board-toast']) {
				const b = await boxOf(page, sel);
				console.log(`[72.1-09] ${vp.name} ${sel} ${JSON.stringify(b)}`);
				expect(b, `${sel} shows`).not.toBeNull();
				expect.soft(b.left, `${sel}: left margin 8`).toBeGreaterThanOrEqual(7.5);
				expect.soft(b.right, `${sel}: right margin 8`).toBeLessThanOrEqual(b.vw - 7.5);
				if (sel !== '#board-toast') expect.soft(b.pe, `${sel}: no pointer events`).toBe('none');
			}
			const header = await page.evaluate(() => { const f = document.getElementById('topbar-flow'); return { sw: f.scrollWidth, cw: f.clientWidth }; });
			expect.soft(header.sw, 'header flow does not overflow').toBeLessThanOrEqual(header.cw);
			const place = await boxOf(page, '.place-effect-banner');
			expect.soft(place.lines, 'Place banner wraps to at most 4 lines (name + 2)').toBeLessThanOrEqual(4);
			// A tap during the banners reaches the controls (hit test at the centre of the button and of the handle).
			const hits = await page.evaluate(() => {
				const probe = (sel) => { const el = document.querySelector(sel); if (!el) return 'missing'; const r = el.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return el === top || el.contains(top) ? 'ok' : `covered by ${top?.className}`; };
				return { endTurn: probe('#btn-end-turn'), handToggle: probe('#phone-hand-toggle') };
			});
			expect.soft(hits, 'End Turn and the hand handle stay tappable').toEqual({ endTurn: 'ok', handToggle: 'ok' });
		});

		test('the spotlight is centred, clear of the strip and the bar, and takes no tap', async ({ page }) => {
			test.setTimeout(90000);
			await boot(page);
			await seedBannerBoard(page);
			await page.evaluate(async () => {
				const m = await import('/src/ui/cardSpotlight.js');
				m.showCardSpotlight({ cardId: 'piecie_kannetje_melk', source: { zone: 'piecie', playerId: 'player_1', slotIndex: 0 } });
			});
			await page.waitForTimeout(1200);
			const s = await boxOf(page, '.card-spotlight');
			const ref = await page.evaluate(() => ({ strip: document.getElementById('status-strip')?.getBoundingClientRect().bottom ?? 0, bar: document.getElementById('phone-bar')?.getBoundingClientRect().top ?? 0 }));
			console.log(`[72.1-09] ${vp.name} spotlight ${JSON.stringify(s)} ${JSON.stringify(ref)}`);
			expect(s, 'spotlight shows').not.toBeNull();
			expect.soft(Math.abs((s.left + s.right) / 2 - s.vw / 2), 'centred within 4 px').toBeLessThanOrEqual(4);
			expect.soft(s.top, 'below the status strip').toBeGreaterThanOrEqual(ref.strip - 1);
			expect.soft(s.bottom, 'above the bar').toBeLessThanOrEqual(ref.bar + 1);
			expect.soft(s.pe).toBe('none');
		});
	});
}

test.describe('desktop guard (1920x1080): the cast chip is centred under its card', () => {
	test.use({ viewport: { width: 1920, height: 1080 } });
	test('chip centre equals tile centre, below the tile', async ({ page }) => {
		await boot(page);
		await seedBannerBoard(page);
		const c = await castChipOn(page, 'player_1', 0);
		expect(c).not.toBeNull();
		const tile = await page.evaluate(() => { const r = document.querySelector('[data-zone="mosje"][data-player-id="player_1"][data-slot-index="0"]')?.getBoundingClientRect(); return r ? { cx: r.left + r.width / 2, bottom: r.bottom } : null; });
		expect(tile).not.toBeNull();
		expect(Math.abs((c.left + c.right) / 2 - tile.cx), 'centred').toBeLessThanOrEqual(2);
		expect(c.top, 'below the tile').toBeGreaterThanOrEqual(tile.bottom - 1);
	});
});
