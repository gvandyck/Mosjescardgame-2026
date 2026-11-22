/**
 * phone-tile-badges.spec.js - Phase 72.1-04 (D-05, D-04, D-13; MOB-01, MOB-04): on a phone a Mosje tile with attachments or timed
 * effects shows ONE count badge ("2 gear, 1 effect"; a narrow tile "2+1") instead of the chip row and the tag lines; with nothing
 * attached there is no badge. The badge text is at least 11 px and clear of the name, Power and MP boxes, its touch area is at least
 * 44 x 44 inside the tile, a tap on it opens the Mosje detail (attachments n / max and the timed effects), a tap elsewhere on the
 * tile still opens the tray (own) or the detail (opponent). Desktop (1920x1080, mouse) keeps the chips and tag lines. 395x731,
 * 390x844, 360x740, touch, headless. One screenshot at 395x731 (72.1-04-tile-badges.png).
 */
import { test, expect } from '@playwright/test';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { seedTileState, OWN_TILE, OWN_BARE, OPP_TILE, OPP_BARE, TIMED_TEXT } from '../../helpers/phoneTileState.js';
import { intersects } from '../../helpers/phoneGeometry.js';
import { savePhoneShot } from '../../helpers/savePhoneShot.js';

/** The boxes of one tile and its badge, read from the live DOM (rects, plus the visible pill text and its font size). */
async function readTile(page, tileSel) {
	return page.evaluate((sel) => {
		const tile = document.querySelector(sel);
		const box = (el) => {
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return { x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
		};
		const badge = tile.querySelector('.tile-count-badge');
		const shown = badge && [...badge.querySelectorAll('span')].find((s) => getComputedStyle(s).display !== 'none' && s.getBoundingClientRect().width > 0);
		const cs = (el, p) => (el ? getComputedStyle(el)[p] : null);
		return {
			tile: box(tile),
			name: box(tile.querySelector('.cv2-tile-name')),
			power: box(tile.querySelector('.cv2-tile-stat--left')),
			mp: box(tile.querySelector('.cv2-tile-stat--right')),
			badgeCount: tile.querySelectorAll('.tile-count-badge').length,
			badge: box(badge),
			pill: box(shown),
			pillText: shown ? shown.textContent : null,
			pillFont: shown ? parseFloat(cs(shown, 'fontSize')) : null,
			fullShown: badge ? getComputedStyle(badge.querySelector('.tile-count-badge__full')).display !== 'none' : null,
			chips: tile.querySelector('.tile-chips') ? cs(tile.querySelector('.tile-chips'), 'display') : 'absent',
			tags: tile.querySelector('.tile-tags') ? cs(tile.querySelector('.tile-tags'), 'display') : 'absent',
		};
	}, tileSel);
}

/** What the points of the badge's 44 x 44 hit square (centre +-20 px, kept inside the tile) land on, when it is not the badge. */
async function hitSquareMisses(page, tileSel) {
	return page.evaluate((sel) => {
		const tile = document.querySelector(sel);
		const badge = tile.querySelector('.tile-count-badge');
		const t = tile.getBoundingClientRect();
		const b = badge.getBoundingClientRect();
		const cx = b.left + b.width / 2;
		const cy = b.top + b.height / 2;
		const bad = [];
		for (const dx of [-20, 0, 20]) for (const dy of [-20, 0, 20]) {
			const x = cx + dx; const y = cy + dy;
			if (x < t.left + 1 || x > t.right - 1 || y < t.top + 1 || y > t.bottom - 1) continue;
			const hit = document.elementFromPoint(x, y);
			if (!hit || !badge.contains(hit)) bad.push(`${dx},${dy} -> ${hit ? hit.className || hit.tagName : 'none'}`);
		}
		return bad;
	}, tileSel);
}

function expectClear(t, who) {
	for (const k of ['name', 'power', 'mp']) {
		expect(t[k], `${who}: ${k} box exists`).not.toBeNull();
		expect(intersects(t.pill, t[k]), `${who}: the badge text does not overlap the ${k} box`).toBe(false);
	}
	const inside = (b) => b.x >= t.tile.x - 0.5 && b.right <= t.tile.right + 0.5 && b.y >= t.tile.y - 0.5 && b.bottom <= t.tile.bottom + 0.5;
	expect(inside(t.pill), `${who}: the badge text is inside its tile`).toBe(true);
	expect(t.pillFont, `${who}: badge text at least 11 px`).toBeGreaterThanOrEqual(11);
	expect(t.badge.w, `${who}: badge touch area width >= 44`).toBeGreaterThanOrEqual(43.5);
	expect(t.badge.h, `${who}: badge touch area height >= 44`).toBeGreaterThanOrEqual(43.5);
	expect(inside(t.badge), `${who}: touch area inside the tile`).toBe(true);
}

/** Close the open detail view with its Close button (a 44 px touch target on a phone). */
async function closeDetail(page) {
	await page.locator('#modal-close-preview').tap();
	await expect(page.locator('.modal-root--open')).toHaveCount(0);
}

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone tile badges at ${vp.name}`, () => {
		test.use(phoneUse(vp));

		test('(a) own tile: one badge "2 gear, 1 effect" instead of chips and tags; bare tiles have none', async ({ page }) => {
			await seedTileState(page);
			const own = await readTile(page, OWN_TILE);
			expect(own.badgeCount, 'one count badge on my tile').toBe(1);
			expect(own.fullShown, 'my tile shows the full text').toBe(true);
			expect(own.pillText).toBe('2 gear, 1 effect');
			expect(own.chips, 'chips hidden on a phone').toBe('none');
			expect(own.tags, 'tags hidden on a phone').toBe('none');
			expectClear(own, 'own');
			expect(await hitSquareMisses(page, OWN_TILE), 'the 44 x 44 hit square belongs to the badge').toEqual([]);
			expect((await readTile(page, OWN_BARE)).badgeCount, 'a tile with nothing attached has no badge').toBe(0);
			expect((await readTile(page, OPP_BARE)).badgeCount, 'a bare opponent tile has no badge').toBe(0);
		});

		test('(b) opponent tile: one attachment, a narrow tile shows the compact text', async ({ page }) => {
			await seedTileState(page);
			const opp = await readTile(page, OPP_TILE);
			expect(opp.badgeCount, 'one count badge on the opponent tile').toBe(1);
			expect(opp.chips).toBe('none');
			expect(opp.tags, 'no tags on this tile at all').toBe('absent');
			const narrow = opp.tile.w < 100;
			expect(opp.fullShown, `tile ${Math.round(opp.tile.w)} px wide: ${narrow ? 'compact' : 'full'} text`).toBe(!narrow);
			expect(opp.pillText).toBe(narrow ? '1' : '1 gear');
			expectClear(opp, 'opponent');
			expect(await hitSquareMisses(page, OPP_TILE), 'the hit square belongs to the badge').toEqual([]);
		});

		test('(c) a tap on the badge opens the detail with attachments n / max and the timed effect; a tap elsewhere opens the tray', async ({ page }) => {
			await seedTileState(page);
			await page.locator(`${OWN_TILE} .tile-count-badge`).tap();
			const root = page.locator('.modal-root--open');
			await expect(root).toContainText('Attachments 2 / 2');
			await expect(root).toContainText(TIMED_TEXT);
			await expect(root).toContainText('Dumbbells');
			await expect(page.locator('[data-action-tray]'), 'the badge tap did not open the tray').toHaveCount(0);
			await closeDetail(page);

			// Elsewhere on my tile (above the badge's touch box, over the art): the tray, not the detail.
			const tile = await page.locator(OWN_TILE).boundingBox();
			await page.locator(OWN_TILE).tap({ position: { x: Math.round(tile.width * 0.6), y: Math.round(tile.height * 0.2) } });
			await expect(page.locator('[data-action-tray]')).toBeVisible();
			await expect(page.locator('.modal-root--open')).toHaveCount(0);
			await page.keyboard.press('Escape');

			// The opponent's tile: the badge and the tile both reach the detail, which lists the one attachment.
			await page.locator(`${OPP_TILE} .tile-count-badge`).tap();
			await expect(page.locator('.modal-root--open')).toContainText('Attachments 1 / 2');
			await closeDetail(page);
			const opp = await page.locator(OPP_TILE).boundingBox();
			await page.locator(OPP_TILE).tap({ position: { x: Math.round(opp.width * 0.85), y: Math.round(opp.height * 0.5) } });
			await expect(page.locator('.modal-root--open')).toContainText('Attachments 1 / 2');
			await closeDetail(page);
			if (vp.name === PIXEL_VIEWPORT.name) await savePhoneShot(page, '72.1-04-tile-badges');
		});
	});
}

test.describe('desktop guard: chips and tags stay, the badge is not displayed', () => {
	test.use({ viewport: { width: 1920, height: 1080 } });

	test('1920x1080: chips and tag lines visible, count badge display none', async ({ page }) => {
		await seedTileState(page);
		const own = await readTile(page, OWN_TILE);
		expect(own.chips).not.toBe('none');
		expect(own.chips).not.toBe('absent');
		expect(own.tags).not.toBe('none');
		await expect(page.locator(`${OWN_TILE} .tile-chips .chip`)).toHaveCount(2);
		await expect(page.locator(`${OWN_TILE} .tile-tags .tag-line`)).toHaveCount(1);
		expect(await page.locator(`${OWN_TILE} .tile-count`).evaluate((el) => getComputedStyle(el).display)).toBe('none');
		expect(await page.locator(`${OWN_TILE} .tile-count-badge`).evaluate((el) => getComputedStyle(el).display)).toBe('none');
	});
});
