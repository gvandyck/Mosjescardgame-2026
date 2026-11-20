/**
 * choices-with-cards.spec.js - Phase 72-11 (D-13): the new pauses show the cards as faces in the option modal, each with a
 * visible, labelled leave option where the card text allows one. Headless 1920x1080 (run through a temp config).
 */
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, setEnergy, setHand, getGameState,
} from './helpers.js';
import { abilityByTap, activateByTap } from '../helpers/boardTaps.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const SHOT = '.planning/phases/72-screens-for-the-new-design/shots/72-11-wizard-top-3.png';
const hook = (page, name, ...args) => page.evaluate(({ n, a }) => window.__testHooks[n](...a), { n: name, a: args });

async function boot(page) {
	await seedOfflineSession(page, 'STARTER_PHYSICAL', 'STARTER_DIGITAL');
	const problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await page.evaluate(() => window.__testHooks.clearEntryProtection?.());
	await setMosjeOnField(page, 'player_2', 0, 'mosje_michelle', { mp: 40, level: 1 });
	return problems;
}

const faces = (page) => page.locator('.modal-option--card .card-v1');

test('Wizard: the top 3 are faces; the pick goes to the hand, the other two to the bottom', async ({ page }) => {
	const problems = await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_wizard', { mp: 10, level: 1 });
	await setEnergy(page, 'player_1', 3);
	await hook(page, 'setDeckTop', 'player_1', ['piecie_affoe', 'piecie_straffoe', 'piecie_slecht_gezet']);
	const before = await getGameState(page);
	await abilityByTap(page, 'mosje_gandoe_wizard');
	await expect(page.locator('.modal-option--card')).toHaveCount(3);
	await expect(faces(page)).toHaveCount(3);
	await page.screenshot({ path: SHOT });
	await page.locator('.modal-option--card', { hasText: 'Straffoe' }).first().click();
	await expect.poll(async () => (await getGameState(page)).players.player_1.hand.some(c => c.cardId === 'piecie_straffoe')).toBe(true);
	const after = await getGameState(page);
	expect(after.players.player_1.deck.slice(-2).map(c => c.cardId)).toEqual(['piecie_affoe', 'piecie_slecht_gezet']);
	expect(after.players.player_1.deck.length).toBe(before.players.player_1.deck.length - 1);
	expect(problems).toEqual([]);
});

test('FPS West: the opponent hand as faces plus a visible "Leave it" that costs nothing', async ({ page }) => {
	const problems = await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_fps_west', { mp: 30, level: 1 });
	await setEnergy(page, 'player_1', 3);
	await setHand(page, 'player_2', ['piecie_affoe', 'piecie_straffoe']);
	await abilityByTap(page, 'mosje_fps_west');
	await expect(faces(page)).toHaveCount(2);
	const leave = page.locator('.modal-option-leave');
	await expect(leave).toBeVisible();
	await expect(leave).toHaveText('Leave it');
	await leave.click();
	await expect(page.locator('.modal-option--card')).toHaveCount(0);
	const s = await getGameState(page);
	expect(s.players.player_1.activeSlots[0].mp).toBe(30);
	expect(s.players.player_2.hand.map(c => c.cardId)).toEqual(['piecie_affoe', 'piecie_straffoe']);
	expect(problems).toEqual([]);
});

test('Ming: the drawn Piecie is the prompt card and "Keep it in your hand" is visible', async ({ page }) => {
	const problems = await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_ming_natural', { mp: 30, level: 1 });
	await setEnergy(page, 'player_1', 3);
	await hook(page, 'setDeckTop', 'player_1', ['piecie_kannetje_melk']);
	await abilityByTap(page, 'mosje_ming_natural');
	await expect(page.locator('.option-prompt-card .card-v1')).toHaveCount(1);
	const keep = page.locator('.modal-option-leave');
	await expect(keep).toBeVisible();
	await expect(keep).toHaveText('Keep it in your hand');
	await expect(page.locator('.modal-mosje-select-btn', { hasText: 'Activate it for 0 Energy' })).toBeVisible();
	await keep.click();
	await expect.poll(async () => (await getGameState(page)).players.player_1.hand.some(c => c.cardId === 'piecie_kannetje_melk')).toBe(true);
	expect(problems).toEqual([]);
});

test('Attach replace: the two attached cards are shown as faces', async ({ page }) => {
	const problems = await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_michelle', { mp: 30, level: 1 });
	await setEnergy(page, 'player_1', 3);
	await hook(page, 'attachToMosje', 'player_1', 0, 'piecie_keyboard');
	await hook(page, 'attachToMosje', 'player_1', 0, 'piecie_controller');
	await hook(page, 'setPiecieOnField', 'player_1', 0, 'piecie_dumbbells', { faceDown: true });
	await hook(page, 'unlockPiecies', 'player_1');
	await activateByTap(page, 'piecie_dumbbells', { force: true });
	await expect(page.locator('.modal-option--card')).toHaveCount(2);
	await expect(faces(page)).toHaveCount(2);
	await page.locator('.modal-option--card').nth(1).click();
	await expect.poll(async () => (await getGameState(page)).players.player_1.activeSlots[0].attachments.map(a => a.cardId)).toEqual(['piecie_keyboard', 'piecie_dumbbells']);
	expect(problems).toEqual([]);
});

test('Magic Prompt: the found gear cards are faces', async ({ page }) => {
	const problems = await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_ming_natural', { mp: 30, level: 1 });
	await setEnergy(page, 'player_1', 3);
	await hook(page, 'setDeckTop', 'player_1', ['piecie_affoe', 'piecie_keyboard', 'piecie_controller']);
	await hook(page, 'setPiecieOnField', 'player_1', 0, 'piecie_magicprompt', { faceDown: true });
	await hook(page, 'unlockPiecies', 'player_1');
	await activateByTap(page, 'piecie_magicprompt', { force: true });
	await expect(page.locator('.modal-option--card').first()).toBeVisible();
	expect(await faces(page).count()).toBeGreaterThanOrEqual(2);
	await page.locator('.modal-option--card', { hasText: 'Keyboard' }).first().click();
	await expect.poll(async () => (await getGameState(page)).players.player_1.hand.some(c => c.cardId === 'piecie_keyboard')).toBe(true);
	expect(problems).toEqual([]);
});
