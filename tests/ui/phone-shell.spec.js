/**
 * phone-shell.spec.js - Phase 65-01 (MOB-06, MOB-09; D-01, D-02, D-07, D-15, D-18, D-19): the phone shell. A touch phone at
 * 390x844 and 360x740 gets: a viewport meta with viewport-fit=cover (pinch-zoom stays allowed), touch hygiene and a 100dvh page,
 * a readable header (turn label not cut, How to Win / Battle Log at least 44x44, popovers inside the screen), a version badge that
 * overlaps nothing; a phone held sideways (short landscape, coarse pointer) shows the "turn your phone upright" notice on the
 * lobby and the game page, while a mouse window, a portrait phone and the desktop never do.
 * Emulation (isMobile + hasTouch) proves the layout and the media-query switches; the real Safari address bar and safe areas
 * are Gandalf's phone (65-HUMAN-UAT.md).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession } from './helpers.js';
import { PHONE_VIEWPORTS, phoneUse } from '../helpers/phoneViewports.js';
import { seedPhoneBoard } from '../helpers/phoneBoard.js';
import { rectOf, intersects, undersized, pageOverflow } from '../helpers/phoneGeometry.js';
import { servePlaceholderFirebase } from '../helpers/servePlaceholderFirebase.js';

const LOBBY_URL = '/';

test('D-18: the viewport meta of game.html and index.html has viewport-fit=cover and keeps pinch-zoom allowed', () => {
	for (const file of ['game.html', 'index.html']) {
		const html = fs.readFileSync(file, 'utf8');
		const meta = html.match(/<meta\s+name="viewport"\s+content="([^"]*)"/i)?.[1] ?? '';
		expect(meta, `${file} viewport meta`).toContain('viewport-fit=cover');
		expect(meta, `${file} must not block pinch-zoom (maximum-scale)`).not.toContain('maximum-scale');
		expect(meta, `${file} must not block pinch-zoom (user-scalable)`).not.toMatch(/user-scalable\s*=\s*(no|0)/i);
	}
});

for (const vp of PHONE_VIEWPORTS) {
	test.describe(`phone shell at ${vp.name}`, () => {
		test.use(phoneUse(vp));

		test('D-18: touch hygiene and a 100dvh page without scrolling', async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page);
			const read = await page.evaluate(() => ({
				touchAction: getComputedStyle(document.body).touchAction,
				overscroll: getComputedStyle(document.body).overscrollBehaviorY,
				bodyH: Math.round(document.body.getBoundingClientRect().height * 10) / 10,
				innerH: innerHeight,
				scrollH: document.documentElement.scrollHeight,
			}));
			expect.soft(read.touchAction, 'body touch-action').toBe('manipulation');
			expect.soft(read.overscroll, 'body overscroll-behavior (no pull-to-refresh)').toBe('none');
			expect.soft(Math.abs(read.bodyH - read.innerH), `body height ${read.bodyH} equals the 100dvh window height ${read.innerH}`).toBeLessThanOrEqual(1);
			expect.soft(read.scrollH, 'the page does not scroll vertically').toBeLessThanOrEqual(read.innerH);
			expect.soft((await pageOverflow(page)).x, 'no sideways page scroll').toBeLessThanOrEqual(0);
		});

		test('D-07 / D-15: the header is readable, its two buttons are at least 44x44 and inside the screen', async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page);
			const label = await page.evaluate(() => {
				const el = document.getElementById('turn-label');
				const cs = getComputedStyle(el);
				const r = el.getBoundingClientRect();
				return {
					text: el.textContent.trim(), cutX: el.scrollWidth - el.clientWidth, cutY: el.scrollHeight - el.clientHeight,
					ellipsis: cs.textOverflow === 'ellipsis' && cs.overflow !== 'visible' && el.scrollWidth > el.clientWidth,
					left: r.left, right: r.right, width: r.width, innerW: innerWidth,
				};
			});
			expect.soft(label.cutX, `turn label "${label.text}" is not cut sideways`).toBeLessThanOrEqual(1);
			expect.soft(label.cutY, `turn label "${label.text}" is not cut vertically`).toBeLessThanOrEqual(1);
			expect.soft(label.ellipsis, 'turn label shows no ellipsis').toBe(false);
			expect.soft(label.left >= 0 && label.right <= label.innerW, 'turn label is inside the screen').toBe(true);
			expect.soft(label.width, 'turn label has room to be read').toBeGreaterThanOrEqual(80);

			for (const [id, text, name] of [['btn-toggle-win', 'How to Win 🏆', 'How to Win'], ['btn-toggle-log', 'Battle Log', 'Battle Log']]) {
				const btn = page.locator(`#${id}`);
				const box = await rectOf(page, `#${id}`);
				expect.soft(box.w >= 44 && box.h >= 44, `#${id} is at least 44x44 (is ${box.w}x${box.h})`).toBe(true);
				expect.soft(box.x >= 0 && box.right <= vp.width && box.y >= 0 && box.bottom <= vp.height, `#${id} is fully inside the screen`).toBe(true);
				expect.soft(await btn.getAttribute('aria-label'), `#${id} has an accessible name`).toBe(name);
				expect.soft((await btn.textContent()).trim(), `#${id} text content is unchanged`).toBe(text);
			}
			expect.soft(await undersized(page, '.topbar-actions button'), 'header buttons').toEqual([]);
		});

		test('D-07: the version badge is inside the screen, overlaps nothing and does not take taps', async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page);
			const badge = await rectOf(page, '#app-version');
			expect(badge, 'the badge exists').not.toBeNull();
			expect.soft(badge.x >= 0 && badge.right <= vp.width && badge.y >= 0 && badge.bottom <= vp.height, 'badge inside the screen').toBe(true);
			for (const sel of ['#turn-label', '#btn-toggle-win', '#btn-toggle-log', '#status-strip', '#board-root']) {
				expect.soft(intersects(badge, await rectOf(page, sel)), `the version badge does not overlap ${sel}`).toBe(false);
			}
			expect.soft(await page.evaluate(() => getComputedStyle(document.getElementById('app-version')).pointerEvents), 'badge pointer-events').toBe('none');
		});

		test('D-07: the How to Win and Battle Log popovers stay inside the screen', async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page);
			for (const [btn, pop] of [['#btn-toggle-win', '#topbar-win-popover'], ['#btn-toggle-log', '#topbar-log-popover']]) {
				await page.locator(btn).tap();
				await expect(page.locator(`${pop}.is-visible`), `${pop} opens by tap`).toBeVisible();
				const box = await rectOf(page, pop);
				expect.soft(box.x >= 0 && box.right <= vp.width, `${pop} is inside the screen sideways (x ${box.x}..${box.right} of ${vp.width})`).toBe(true);
				expect.soft(box.y >= 0 && box.bottom <= vp.height, `${pop} is inside the screen vertically (y ${box.y}..${box.bottom} of ${vp.height})`).toBe(true);
				await page.locator(btn).tap();
				await expect(page.locator(`${pop}.is-visible`), `${pop} closes by tap`).toHaveCount(0);
			}
		});
	});
}

/** The two pages that must show the notice: the lobby and the game (the game needs a seeded offline session to stay on its page). */
const NOTICE_PAGES = [
	{ name: 'lobby', open: async (page) => { await servePlaceholderFirebase(page); await page.goto(LOBBY_URL); } },
	{ name: 'game', open: async (page) => { await seedOfflineSession(page); await page.goto(GAME_URL_TEST); } },
];

async function readNotice(page) {
	return page.evaluate(() => {
		const el = document.getElementById('rotate-notice');
		if (!el) return null;
		const r = el.getBoundingClientRect();
		const cs = getComputedStyle(el);
		const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
		return {
			display: cs.display, visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0,
			covers: r.left <= 0 && r.top <= 0 && r.right >= innerWidth && r.bottom >= innerHeight,
			onTop: !!hit && (hit === el || el.contains(hit)),
			text: el.textContent.trim(), role: el.getAttribute('role'),
		};
	});
}

test.describe('D-01: rotate notice on a sideways touch phone', () => {
	test.use({ viewport: { width: 740, height: 360 }, isMobile: true, hasTouch: true });
	for (const target of NOTICE_PAGES) {
		test(`${target.name}: the notice covers the screen and asks to turn the phone upright`, async ({ page }) => {
			await target.open(page);
			await page.waitForLoadState('domcontentloaded');
			const notice = await readNotice(page);
			expect(notice, '#rotate-notice exists').not.toBeNull();
			expect.soft(notice.visible, 'the notice is visible').toBe(true);
			expect.soft(notice.covers, 'the notice covers the whole viewport').toBe(true);
			expect.soft(notice.onTop, 'the notice is the topmost thing at the centre of the screen').toBe(true);
			expect.soft(notice.text, 'the notice text').toMatch(/upright/i);
			expect.soft(notice.role, 'the notice is announced (role alert)').toBe('alert');
		});
	}
});

test.describe('D-01: no rotate notice on a mouse window, a portrait phone or the desktop', () => {
	const CASES = [
		{ name: 'short landscape window with a mouse (740x360, no touch)', use: { viewport: { width: 740, height: 360 }, isMobile: false, hasTouch: false } },
		{ name: 'portrait touch phone (390x844)', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
		{ name: 'desktop (1920x1080)', use: { viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false } },
	];
	for (const c of CASES) {
		test.describe(c.name, () => {
			test.use(c.use);
			for (const target of NOTICE_PAGES) {
				test(`${target.name}: the notice is not shown`, async ({ page }) => {
					await target.open(page);
					await page.waitForLoadState('domcontentloaded');
					const notice = await readNotice(page);
					expect(notice, '#rotate-notice exists in the markup (hidden by CSS, not missing)').not.toBeNull();
					expect(notice.visible, 'the notice is hidden').toBe(false);
				});
			}
		});
	}
});

// Pictures for the progress report (not committed, written outside the repo): the seeded board on a touch phone and on the desktop.
const SHOT_DIR = process.env.OBBY65_SHOT_DIR || 'C:/tmp';
const DESKTOP_HAND = ['mosje_alyssa_fissa', 'piecie_kannetje_melk', 'piecie_broodje_doner', 'piecie_kannetje_melk', 'piecie_momentum_boost'];

test.describe('65-01 screenshots', () => {
	test.describe('phone 390x844 (touch)', () => {
		test.use(phoneUse(PHONE_VIEWPORTS[0]));
		test('the seeded board at 390x844', async ({ page }) => {
			test.setTimeout(90000);
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await seedPhoneBoard(page);
			await page.screenshot({ path: `${SHOT_DIR}/65-01-phone-390x844.png` });
		});
	});
	test.describe('desktop 1920x1080 (mouse)', () => {
		test.use({ viewport: { width: 1920, height: 1080 } });
		test('the seeded board at 1920x1080', async ({ page }) => {
			test.setTimeout(90000);
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await seedPhoneBoard(page, { hand: DESKTOP_HAND });
			await page.mouse.move(2, 2);
			await page.waitForTimeout(500);
			await page.screenshot({ path: `${SHOT_DIR}/65-01-desktop-1920x1080.png` });
		});
	});
});
