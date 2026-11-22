/**
 * phone-game-over.spec.js - Phase 72.1-08 (D-06, MOB-06): the game-over screen on a phone, by real taps, at 395x731, 390x844 and
 * 360x740. After a Personal Quest win: the winning card (130-170 px, centred above the Mosje line), the Mosje line, the dice row,
 * the sentence and the stats fit without sideways overflow and scroll inside the panel; the three buttons are pinned at the bottom
 * of the panel (visible at scroll top AND bottom), >= 48 px high, >= 90 % of the panel wide, >= 8 px apart; the last stat row is
 * not hidden behind them. A knockout game over fits the same way with no empty card slot. Play again asks for the starting Mosje
 * (snap row) and starts a new game; Back to Lobby shows the lobby. A desktop guard (1920x1080) keeps the 72-14 layout.
 */
import { test, expect } from '@playwright/test';
import { servePlaceholderFirebase } from '../../helpers/servePlaceholderFirebase.js';
import { forceHumanPersonalQuestWin } from '../../helpers/forceHumanPersonalQuestWin.js';
import { phoneHumanPersonalQuestWin } from '../../helpers/phoneHumanPersonalQuestWin.js';
import { readGameOverCard } from '../../helpers/readGameOverCard.js';
import { savePhoneShot } from '../../helpers/savePhoneShot.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { GAME_URL_TEST, waitForBoard } from '../helpers.js';

const VIEWPORTS = [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS];

function watchProblems(page) {
	const problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
	page.on('console', msg => { if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`); });
	return problems;
}

// A Play vs Bot session and a replay record (so Play again works and asks the starting pick), each seeded only ONCE per tab.
async function seedVsBotSession(page) {
	await page.addInitScript(() => {
		if (sessionStorage.getItem('test:seeded')) return;
		sessionStorage.setItem('test:seeded', '1');
		sessionStorage.setItem('mosjes:offline', JSON.stringify({ name: 'TestPlayer', deckId: 'STARTER_PHYSICAL', botDeckId: 'STARTER_DIGITAL', playerId: 'player_1' }));
		sessionStorage.setItem('obby2:replay', JSON.stringify({ mode: 'vsBot', name: 'TestPlayer', deckChoice: 'STARTER_PHYSICAL', botChoice: 'RANDOM' }));
	});
}

async function openWin(page, { desktop = false } = {}) {
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await (desktop ? forceHumanPersonalQuestWin(page) : phoneHumanPersonalQuestWin(page));
	await expect(page.locator('#reward-overlay')).toBeVisible();
	await page.waitForTimeout(700); // the fade-in finishes
}

async function openKnockout(page) {
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await page.evaluate(() => window.__testHooks.forceKnockout('player_2'));
	await expect(page.locator('#reward-overlay')).toBeVisible({ timeout: 15000 });
	await page.waitForTimeout(700);
}

/** The shared fit checks; `kind` is 'win' or 'knockout'. */
async function expectFits(page, kind) {
	for (const to of ['top', 'bottom']) {
		const g = await readGameOverCard(page, to);
		const where = `${kind} at scroll ${to}: ${JSON.stringify({ card: g.card, actions: g.actions, scrollW: g.scrollW, clientW: g.clientW })}`;
		expect(g.scrollW, `no sideways overflow in the panel (${where})`).toBeLessThanOrEqual(g.clientW);
		expect(g.pageX, 'the page does not scroll sideways').toBeLessThanOrEqual(0);
		expect(g.pageY, 'the page does not scroll').toBeLessThanOrEqual(0);
		expect(g.card.x, `panel left on screen (${where})`).toBeGreaterThanOrEqual(0);
		expect(g.card.right, `panel right on screen (${where})`).toBeLessThanOrEqual(g.win.w + 0.5);
		expect(g.card.y, `panel top on screen (${where})`).toBeGreaterThanOrEqual(0);
		expect(g.card.bottom, `panel bottom on screen (${where})`).toBeLessThanOrEqual(g.win.h + 0.5);
		if (g.scrollH > g.clientH + 1) expect(['auto', 'scroll']).toContain(g.overflowY);
		// Pinned buttons: inside the window and inside the panel at both scroll ends.
		expect(g.actions.y, `buttons top on screen (${where})`).toBeGreaterThanOrEqual(g.card.y - 0.5);
		expect(g.actions.bottom, `buttons bottom inside the panel (${where})`).toBeLessThanOrEqual(g.card.bottom + 0.5);
		expect(g.btns.length, 'Copy Log, Play again, Back to Lobby').toBe(3);
		g.btns.forEach((b, i) => {
			expect(b.h, `button ${i} is at least 48 px high`).toBeGreaterThanOrEqual(47.5);
			expect(b.w, `button ${i} is at least 90% of the panel`).toBeGreaterThanOrEqual(g.card.w * 0.9);
			if (i > 0) expect(b.y - g.btns[i - 1].bottom, `gap above button ${i}`).toBeGreaterThanOrEqual(7.5);
		});
		if (to === 'bottom') {
			const last = g.stats[g.stats.length - 1];
			expect(last.bottom, 'the last stat row is not hidden behind the pinned buttons').toBeLessThanOrEqual(g.actions.y + 0.5);
		}
	}
}

for (const vp of VIEWPORTS) {
	test.describe(`phone game over at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		let problems;
		test.beforeEach(async ({ page }) => {
			await servePlaceholderFirebase(page);
			problems = watchProblems(page);
			await seedVsBotSession(page);
		});
		test.afterEach(() => {
			expect(problems, 'no page error and no console error').toEqual([]);
		});

		test('(a) Personal Quest win: card, Mosje, dice, sentence, stats fit; buttons pinned', async ({ page }) => {
			test.setTimeout(150000);
			await openWin(page);
			const g = await readGameOverCard(page, 'top');
			console.log(`[72.1-08] ${vp.name} win: ${JSON.stringify({ card: g.card, scrollW: g.scrollW, clientW: g.clientW, scrollH: g.scrollH, clientH: g.clientH, questFace: g.questFace, dice: g.dice.length })}`);
			expect(g.title).toBe('Victory!');
			expect(g.reason).toContain('completed Charge! with');
			expect(g.mosjeName, 'the Mosje line').toBe(true);
			expect(g.questFace.w, 'winning card 130-170 px wide').toBeGreaterThanOrEqual(130);
			expect(g.questFace.w).toBeLessThanOrEqual(170);
			const panelMid = g.card.x + g.card.w / 2;
			expect(Math.abs((g.questFace.x + g.questFace.w / 2) - panelMid), 'card centred').toBeLessThanOrEqual(6);
			const mosje = await page.locator('.go-winning-quest__mosje').boundingBox();
			expect(mosje.y, 'Mosje line sits below the card').toBeGreaterThanOrEqual(g.questFace.bottom - 2);
			expect(g.dice.length, 'dice shown').toBeGreaterThan(0);
			for (const d of g.dice) {
				expect(d.x, 'a die is not cut at the left').toBeGreaterThanOrEqual(g.card.x);
				expect(d.right, 'a die is not cut at the right').toBeLessThanOrEqual(g.card.right);
			}
			// 72.1-12: the dice of the winning roll are fully visible at first view (scroll top), above the pinned buttons.
			for (const d of g.dice) {
				expect(d.bottom, `a die is not hidden behind the pinned buttons at first view (die bottom ${d.bottom}, buttons top ${g.actions.y})`).toBeLessThanOrEqual(g.actions.y + 0.5);
			}
			await expect(page.locator('[data-stat="quests"]')).toHaveCount(2);
			await expect(page.locator('[data-stat="personal-quests"]')).toHaveCount(2);
			await expectFits(page, 'win');
			if (vp.name === '395x731') {
				await readGameOverCard(page, 'top');
				await savePhoneShot(page, '72.1-12-game-over');
			}
		});

		test('(b) knockout: no winning card, no empty block, same fit', async ({ page }) => {
			test.setTimeout(150000);
			await openKnockout(page);
			await expect(page.locator('.go-winning-quest')).toHaveCount(0);
			await expectFits(page, 'knockout');
		});

		test('(c) Play again asks the starting Mosje as a snap row and starts a new game', async ({ page }) => {
			test.setTimeout(150000);
			await openWin(page);
			await page.locator('#reward-again-btn').scrollIntoViewIfNeeded();
			await page.locator('#reward-again-btn').tap();
			await page.waitForURL(/game\.html/);
			const startPick = page.locator('.modal-card--cards .modal-option--card').first();
			await expect(startPick, 'the starting Mosje pick appears').toBeVisible({ timeout: 20000 });
			await startPick.tap();
			await waitForBoard(page);
			await expect(page.locator('#reward-overlay')).toHaveCount(0);
		});

		test('(d) Back to Lobby shows the lobby', async ({ page }) => {
			test.setTimeout(150000);
			await openWin(page);
			await page.locator('#reward-back-btn').tap();
			await page.waitForURL('**/index.html');
			await expect(page.locator('#lobby2')).toBeVisible();
			await expect(page.locator('[data-picker="mode"]')).toBeVisible();
		});
	});
}

test.describe('desktop guard at 1920x1080', () => {
	test.use({ viewport: { width: 1920, height: 1080 } });
	test('the game over does not scroll and the card is 200 px wide beside the Mosje', async ({ page }) => {
		test.setTimeout(150000);
		await servePlaceholderFirebase(page);
		await seedVsBotSession(page);
		await openWin(page, { desktop: true });
		const g = await readGameOverCard(page, null);
		expect(g.scrollH, 'scrollHeight equals clientHeight').toBe(g.clientH);
		expect(Math.round(g.questCard.w)).toBe(200);
		const mosje = await page.locator('.go-winning-quest__mosje').boundingBox();
		expect(mosje.x, 'the Mosje is beside the card').toBeGreaterThanOrEqual(g.questCard.right);
	});
});
