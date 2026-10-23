// quest-card-tiers.spec.js — 2.0 Quest cards use the v1 tier design (Phase 7 A7, Phase 62-04).
// Phase 7 A7: Quests have no rarity, so whatever rarity is passed in they stay frame tier 1 (boxed), in their stack colour.
// Renders real 2.0 Quests through renderCard on the demo page at every rarity override, plus the field tile and the
// V4 Quests (no stack) that still fall back to the unified template. Screenshots go to tests/ui/screenshots/cardv1/.
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { seedOfflineSession, GAME_URL_TEST } from './helpers.js';
import { collectFaceZones, findFaceCollisions } from '../helpers/faceZones.js';

const DEMO = '/card-tiers-demo.html?tiers=all';
const OUT = 'tests/ui/screenshots/cardv1';
// One Quest per stack and band shape: Skilled (two 4+), Trained (no roll, can't fail), Coin flip (4+ COIN).
const QUESTS = [
	{ id: 'quest_arm_wrestling', stack: 'FIGHTING', color: 'rgb(194, 65, 12)', need: '2× 4+', needLabel: 'NEED', win: '40', lose: '-30', loseText: '−30', file: 'quest-fighting' },
	{ id: 'quest_debug_system', stack: 'DIGITAL', color: 'rgb(14, 116, 144)', need: '★★', needLabel: 'TRAINED', win: '25', lose: 'none', loseText: "can't fail", file: 'quest-digital' },
	{ id: 'quest_leap_of_faith', stack: 'ARTISTIC', color: 'rgb(162, 28, 175)', need: '4+', needLabel: 'COIN', win: '50', lose: '-25', loseText: '−25', file: 'quest-artistic' },
];

async function mountQuest(page, { id, tier, width = 440, fieldMode = false, failTokens }) {
	await page.evaluate(async ({ id, tier, width, fieldMode, failTokens }) => {
		const [{ renderCard }, { QUESTS }] = await Promise.all([import('/src/ui/cardRenderer.js'), import('/src/data/quests.js')]);
		const quest = QUESTS.find((q) => q.id === id);
		document.getElementById('fx')?.remove();
		const host = document.createElement('div');
		host.id = 'fx';
		host.style.cssText = 'position:absolute;left:0;top:0;z-index:99;background:#000';
		const el = renderCard({ ...quest, rarity: '★'.repeat(tier), ...(failTokens === undefined ? {} : { failTokens }) }, { fieldMode });
		el.style.setProperty('--cv1-w', `${width}px`);
		host.append(el);
		document.body.prepend(host);
	}, { id, tier, width, fieldMode, failTokens });
	return page.locator('#fx > .card');
}

test.describe('2.0 Quest cards in the tier design', () => {
	test.beforeEach(async ({ page }) => {
		await page.setViewportSize({ width: 1920, height: 1080 });
		await page.goto(DEMO);
		await page.waitForSelector('#tier-grid .card');
		fs.mkdirSync(OUT, { recursive: true });
	});

	for (const q of QUESTS) {
		for (const tier of [1, 2, 3, 4]) {
			test(`${q.id} rarity ${tier}: still tier 1, ${q.stack} colour, need ${q.need}, win / lose, placeholder art, no collisions`, async ({ page }) => {
				const card = await mountQuest(page, { id: q.id, tier });
				await expect(card).toHaveClass(/card-v1/);
				await expect(card).toHaveClass(/card--tier-1\b/);
				await expect(card).toHaveClass(/card--boxed/);
				await expect(card).not.toHaveClass(/card--fullart/);
				await expect(card.locator('.ct-diamond--lit')).toHaveCount(0);
				// dice need top-left (no cost), win / lose in the footer, the stack pill in the centre
				await expect(card.locator('[data-cv1-need]')).toHaveAttribute('data-cv1-need', q.need);
				await expect(card.locator('.cv2-corner-val')).toHaveText(q.need);
				await expect(card.locator('.cv2-corner-label')).toHaveText(q.needLabel);
				await expect(card.locator('[data-cv1-win]')).toHaveAttribute('data-cv1-win', q.win);
				await expect(card.locator('[data-cv1-lose]')).toHaveAttribute('data-cv1-lose', q.lose);
				await expect(card.locator('.cv2-stat--right .cv2-stat-val')).toHaveText(q.loseText);
				if (q.lose === 'none') await expect(card.locator('.cv2-stat-val--word')).toHaveCount(1);
				else await expect(card.locator('.cv2-stat--right .cv2-stat-label')).toHaveText('LOSE');
				await expect(card.locator('.cv2-footer-pill')).toHaveText(`${q.stack} QUEST`);
				expect(await card.locator('.cv2-footer-pill').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(q.color);
				// what a Quest does not have
				await expect(card.locator('.cv2-lvl-chip')).toHaveCount(0);
				await expect(card.locator('[data-cv1-power], [data-cv1-mp], [data-cv1-cost]')).toHaveCount(0);
				await expect(card.locator('.cv1-badge')).toHaveCount(0);
				// no real art yet: the stack-colour die placeholder fills the window
				await expect(card.locator('.cv1-window > .cv2-quest-art')).toBeVisible();
				// every face zone stays inside the card and clear of the others
				const zones = await page.evaluate(collectFaceZones, '#fx > .card');
				expect(findFaceCollisions(zones), 'zones that collide or leave the card').toEqual([]);
				if (tier === 1) await card.screenshot({ path: `${OUT}/${q.file}.png` });
			});
		}
		test(`${q.id}: field tile shows need, win/lose and 2 fail pips`, async ({ page }) => {
			const card = await mountQuest(page, { id: q.id, tier: 2, fieldMode: true, width: 240, failTokens: 1 });
			await expect(card).toHaveClass(/card-v1--field/);
			await expect(card.locator('.cv2-first')).toHaveText(/\S/);
			await expect(card.locator('[data-cv1-need]')).toHaveAttribute('data-cv1-need', q.need);
			await expect(card.locator('[data-cv1-win]')).toHaveAttribute('data-cv1-win', q.win);
			await expect(card.locator('[data-cv1-lose]')).toHaveAttribute('data-cv1-lose', q.lose);
			await expect(card.locator('[data-cv1-lose] .cv2-tile-val')).toHaveText(q.loseText);
			await expect(card.locator('[data-cv1-pip]')).toHaveCount(2);
			await expect(card.locator('[data-cv1-pip="filled"]')).toHaveCount(1); // failTokens 1: one filled, one empty ring
			await expect(card.locator('[data-cv1-pip="empty"]')).toHaveCount(1);
			// the filled pip is a solid stack-colour dot, the empty one a ring with no fill
			const fill = (state) => card.locator(`[data-cv1-pip="${state}"]`).evaluate((e) => getComputedStyle(e).backgroundColor);
			expect(await fill('filled')).toBe(q.color);
			expect(await fill('empty')).toBe('rgba(0, 0, 0, 0)');
			// no cost, Power / MP or legacy QUEST pill on a Quest tile
			await expect(card.locator('[data-cv1-power], [data-cv1-mp], [data-cv1-cost], .cv1-pill, .cv1-badge')).toHaveCount(0);
			// the tile zones stay clear of each other and inside the tile, at 240 and at the board size
			expect(findFaceCollisions(await page.evaluate(collectFaceZones, '#fx > .card')), 'tile zones collide at 240').toEqual([]);
			await card.screenshot({ path: `${OUT}/${q.file.replace('quest-', 'quest-tile-')}.png` });
			if (q.id === 'quest_arm_wrestling') await card.screenshot({ path: `${OUT}/quest-tile.png` });
			await mountQuest(page, { id: q.id, tier: 2, fieldMode: true, width: 150, failTokens: 2 });
			expect(findFaceCollisions(await page.evaluate(collectFaceZones, '#fx > .card')), 'tile zones collide at 150').toEqual([]);
			await expect(page.locator('#fx > .card [data-cv1-pip="filled"]')).toHaveCount(2);
		});
	}
});

test('a V4 Quest without a stack falls back to the unified template (no 2.0 face, no console error)', async ({ page }) => {
	const errors = [];
	page.on('pageerror', (e) => errors.push(String(e)));
	page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
	fs.mkdirSync(OUT, { recursive: true });
	await seedOfflineSession(page);
	await page.setViewportSize({ width: 1920, height: 1080 });
	await page.goto(GAME_URL_TEST);
	await page.waitForFunction(() => window.__testHooks?.getGameState?.()?.players, null, { timeout: 30000 });
	await page.evaluate(() => window.__testHooks.setHand('player_1', ['quest_personal_kickboxing_bootcamp']));
	const card = page.locator('#hand-root .card').first();
	await expect(card).toBeVisible();
	await page.waitForTimeout(400);
	await expect(card).toHaveAttribute('data-card-id', 'quest_personal_kickboxing_bootcamp');
	await expect(card.locator('.cv1-face')).toHaveCount(0);
	await expect(card).not.toHaveClass(/card-v1/);
	await expect(card.locator('.uc-title')).toHaveText(/\S/); // the unified template draws it: a title is there
	await card.screenshot({ path: `${OUT}/quest-v4-fallback.png` });
	expect(errors, 'console errors while the V4 Quest is in the hand').toEqual([]);
});
