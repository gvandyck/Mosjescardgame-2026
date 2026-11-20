/**
 * personal-quest-play.spec.js - Phase 72-04 (D-02, D-03, D-04): tap a Personal Quest in the hand, read Needs / Pay / Roll and a Play
 * button (with the engine's reason when it is off), pick the Mosje by card face, see the dice, see what a fail discarded.
 * Headless at 1920x1080 (run through a temp config).
 */
import { test, expect } from '@playwright/test';
import { PERSONAL_QUESTS } from '../../src/data/personalQuests.js';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setHand, setEnergy, setNextDice, clickModalOption, readLog,
} from './helpers.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const PQ = (id) => PERSONAL_QUESTS.find(q => q.id === id);
const SHOT = '.planning/phases/72-screens-for-the-new-design/shots/72-04-personal-quest-detail.png';

async function boot(page, hand) {
	await seedOfflineSession(page, 'EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS');
	const problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', hand);
	await setHand(page, 'player_2', []);
	await setEnergy(page, 'player_1', 3);
	return problems;
}

// A tap on the body of the card (not its Play button).
async function tapCard(page, cardId) {
	const face = page.locator(`.hand-card-wrap[data-card-id="${cardId}"] .hand-card`).first();
	await face.waitFor({ timeout: 5000 });
	await face.dispatchEvent('click');
	await page.locator('.card-detail').waitFor({ timeout: 5000 });
}

const section = (page, label) => page.locator('.card-detail .cd-sec', { has: page.locator('.cd-sec-label', { hasText: new RegExp(`^${label}$`) }) });

test('no Level 3 Mosje: the detail shows Needs / Pay / Roll, Play is off and says why', async ({ page }) => {
	const problems = await boot(page, ['pq_charge']);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	await tapCard(page, 'pq_charge');

	const def = PQ('pq_charge');
	await expect(section(page, 'Needs').locator('.cd-sec-text')).toHaveText(def.needsText);
	await expect(section(page, 'Pay').locator('.cd-sec-text')).toHaveText(def.payText);
	await expect(section(page, 'Roll').locator('.cd-sec-text')).toHaveText(def.rollText);

	const play = page.locator('.card-detail .cd-actions button[data-action-id="play"]');
	await expect(play).toBeDisabled();
	await expect(play).toHaveAttribute('title', 'You have no Level 3 Mosje');
	await expect(page.locator('.card-detail .cd-why')).toContainText('You have no Level 3 Mosje');

	await page.locator('#modal-close-preview').click();
	const wrap = page.locator('.hand-card-wrap[data-card-id="pq_charge"]').first();
	await wrap.hover({ position: { x: 100, y: 30 } });
	await expect(wrap.locator('.hand-card__play-btn')).toHaveAttribute('title', 'You have no Level 3 Mosje');
	expect(problems).toEqual([]);
});

test('Play from the detail: Mosje faces, dice row, win goes to game over', async ({ page }) => {
	const problems = await boot(page, ['pq_charge']);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 3 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_jeffrey', { mp: 10, level: 1 });
	await clearEntryProtection(page);
	await setNextDice(page, [6, 6, 6, 6]);
	await tapCard(page, 'pq_charge');

	const play = page.locator('.card-detail .cd-actions button[data-action-id="play"]');
	await expect(play).toBeEnabled();
	await expect(page.locator('.card-detail .cd-why')).toHaveCount(0);
	await page.waitForTimeout(900); // let the modal fade-in finish
	await page.screenshot({ path: SHOT });
	await play.click();

	await expect(page.locator('.modal-mosje-select-btn')).toHaveCount(2);
	await expect(page.locator('.modal-option--card')).toHaveCount(2);
	await expect(page.locator('.modal-mosje-select-btn[data-id="1"]')).toBeDisabled();
	await expect(page.locator('.modal-mosje-select-btn[data-id="1"]')).toContainText('Level 3');
	await clickModalOption(page, '0');

	await expect(page.locator('.modal-card .dice-row .die')).toHaveCount(3, { timeout: 5000 });
	await clickModalOption(page, 'ok');
	const overlay = page.locator('#reward-overlay');
	await expect(overlay).toBeVisible({ timeout: 15000 });
	await expect(overlay).toHaveAttribute('data-win-reason', 'PERSONAL_QUEST');
	expect(problems).toEqual([]);
});

test('a failed roll logs what was discarded and the card goes back to the deck', async ({ page }) => {
	const problems = await boot(page, ['pq_sterke_jongen']);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_jeffrey', { mp: 60, level: 3 });
	await clearEntryProtection(page);
	await page.evaluate(() => {
		const h = window.__testHooks;
		h.setActivePlace('place_the_gym', 'player_1');
		h.setPiecieOnField('player_1', 0, 'piecie_dumbbells', { faceDown: true });
		h.unlockPiecies('player_1');
		h.setNextDice([1, 1, 1, 1, 1, 1]);
	});
	const before = (await getGameState(page)).players.player_1.graveyard.length;
	await tapCard(page, 'pq_sterke_jongen');
	await page.locator('.card-detail .cd-actions button[data-action-id="play"]').click();
	await clickModalOption(page, '0');
	await expect(page.locator('.modal-card .dice-row .die').first()).toBeVisible({ timeout: 5000 });
	await clickModalOption(page, 'ok');

	await expect.poll(async () => (await readLog(page)).some(l => /failed/.test(l) && /went back to your deck/.test(l))).toBe(true);
	const line = (await readLog(page)).find(l => /went back to your deck/.test(l));
	expect(line).toContain('Dumbbells');
	const gs = await getGameState(page);
	expect(gs.status).toBe('PLAYING');
	expect(gs.players.player_1.graveyard.length).toBe(before + 1);
	expect(gs.players.player_1.hand.map(c => c.cardId)).not.toContain('pq_sterke_jongen');
	expect(problems).toEqual([]);
});

test('a stale Play is refused by the engine: the game goes on', async ({ page }) => {
	const problems = await boot(page, ['pq_charge']);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 3 });
	await clearEntryProtection(page);
	await tapCard(page, 'pq_charge');
	const play = page.locator('.card-detail .cd-actions button[data-action-id="play"]');
	await expect(play).toBeEnabled();
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 }); // state changes under the open detail
	await play.click();
	await expect(page.locator('.modal-card').first()).toContainText(/cannot/i, { timeout: 5000 });
	await clickModalOption(page, 'ok');
	const gs = await getGameState(page);
	expect(gs.status).toBe('PLAYING');
	expect(gs.players.player_1.hand.map(c => c.cardId)).toContain('pq_charge');
	expect(problems).toEqual([]);
});
