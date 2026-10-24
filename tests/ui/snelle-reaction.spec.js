/**
 * snelle-reaction.spec.js - U6: human Snelle reaction prompt on the live board (Phase 57, TABLE-04).
 * The bot attacks through the real playBotSteps path (testMode hook botAttack); the human sees a 'Reaction'
 * prompt only with a fitting Snelle, a free Piecie slot and enough Energy. Own-side: Sleutelpuntje before a Quest roll.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setHand, setEnergy, setQuestFaceUp, setNextDice,
} from './helpers.js';
import { beginQuestByTap } from '../helpers/boardTaps.js';
import { answerReaction, expectNoReactionPrompt } from '../helpers/reactionUi.js';
import { getPower } from '../../src/engine/mp/getPower.js';

async function boot(page, hand, energy) {
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 50, level: 2 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	await setHand(page, 'player_1', hand);
	await setHand(page, 'player_2', []);
	await setEnergy(page, 'player_1', energy);
}
const botAttacks = (page) => page.evaluate(() => window.__testHooks.botAttack(0, 0));
const myMp = async (page) => (await getGameState(page)).players.player_1.activeSlots[0].mp;
const settled = (page) => expect.poll(async () => (await getGameState(page)).pendingReaction == null && (await getGameState(page)).activePlayerId, { timeout: 15000 }).toBeTruthy();

test('a: The Protector is offered and played from saved Energy; attack still resolves', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page, ['snelle_the_protector'], 3);
	const power = getPower((await getGameState(page)).players.player_2.activeSlots[0]);
	await botAttacks(page);
	await answerReaction(page, 'snelle_the_protector');
	await settled(page);
	const gs = await getGameState(page);
	expect(gs.players.player_1.graveyard.some(c => c.cardId === 'snelle_the_protector'), 'Snelle in discard').toBe(true);
	expect(gs.players.player_1.hand.some(c => c.cardId === 'snelle_the_protector')).toBe(false);
	expect(gs.players.player_1.activeSlots[0].mp, 'attack resolved, loss reduced by Protector').toBeGreaterThan(50 - power);
});

test('d: Pass takes the full Power loss', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page, ['snelle_the_protector'], 3);
	const power = getPower((await getGameState(page)).players.player_2.activeSlots[0]);
	await botAttacks(page);
	await answerReaction(page, '__pass__');
	await settled(page);
	expect(await myMp(page)).toBe(50 - power);
	expect((await getGameState(page)).players.player_1.hand.some(c => c.cardId === 'snelle_the_protector')).toBe(true);
});

test('b: no free Piecie slot -> no prompt, full Power loss', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page, ['snelle_the_protector'], 3);
	for (let i = 0; i < 3; i++) await page.evaluate((i) => window.__testHooks.setPiecieOnField('player_1', i, 'piecie_kannetje_melk', { faceDown: true }), i);
	const power = getPower((await getGameState(page)).players.player_2.activeSlots[0]);
	await botAttacks(page);
	await expectNoReactionPrompt(page);
	await settled(page);
	expect(await myMp(page)).toBe(50 - power);
});

test('c: not enough Energy (Perfect Dodge costs 2, Energy 1) -> no prompt', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page, ['snelle_perfect_dodge'], 1);
	const power = getPower((await getGameState(page)).players.player_2.activeSlots[0]);
	await botAttacks(page);
	await expectNoReactionPrompt(page);
	await settled(page);
	expect(await myMp(page)).toBe(50 - power);
});

async function questWithSleutelpuntje(page, energy, choose) {
	await boot(page, ['snelle_sleutelpuntje'], energy);
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out');
	await setNextDice(page, [6, 6, 6, 6, 6, 6]);
	await beginQuestByTap(page, 0); // tap the Mosje, Quest in its tray; then the FIGHTING Quest tile
	await page.locator('.quest-stack[data-quest-stack="FIGHTING"]').click();
	if (choose === 'none') {
		await expectNoReactionPrompt(page, 800);
	} else {
		await answerReaction(page, choose);
	}
	const text = await page.locator('.modal-card').first().innerText();
	return (text.match(/dice ([\d, ]+)/)?.[1] ?? '').split(',').filter(x => x.trim()).length;
}

test('e: Sleutelpuntje before the own Quest roll gives one more die; Pass does not; 0 Energy gives no prompt', async ({ page, browser }) => {
	test.setTimeout(90000);
	const withCard = await questWithSleutelpuntje(page, 3, 'snelle_sleutelpuntje');
	const p2 = await (await browser.newContext()).newPage();
	const without = await questWithSleutelpuntje(p2, 3, '__pass__');
	expect(withCard).toBe(without + 1);
	const p3 = await (await browser.newContext()).newPage();
	const none = await questWithSleutelpuntje(p3, 0, 'none');
	expect(none).toBe(without);
});

// 63-07 (D-20, U6): the reaction prompt is mobile-ready: it names the incoming attack, shows each Snelle with its Energy cost and
// ends in "No reaction"; big rows, no cancel button, no hover needed.
const rowHeights = (page) => page.locator('.modal-card--reaction .modal-mosje-select-btn').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));

test('f: the attack prompt shows who attacks whom for how much, each Snelle as <Name> · N Energy, and a No reaction row', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page, ['snelle_the_protector', 'snelle_drain_reversal'], 3);
	const power = getPower((await getGameState(page)).players.player_2.activeSlots[0]);
	await botAttacks(page);
	const modal = page.locator('.modal-card--reaction');
	await modal.waitFor({ state: 'visible', timeout: 8000 });
	await expect(modal.locator('h3')).toHaveText('Reaction');
	const loss = (await getGameState(page)).pendingReaction.preview.mpLoss?.[0] ?? power;
	await expect(modal.locator('p'), 'the incoming attack, first names and the MP loss').toHaveText(`Gandoe attacks Binti: −${loss} MP`);

	// One row per eligible Snelle: "<Name> · N Energy" with its text as the meta line.
	const row = (id) => modal.locator(`.modal-mosje-select-btn[data-id="${id}"]`);
	await expect(row('snelle_the_protector').locator('.mosje-select-name')).toHaveText('The Protector · 0 Energy');
	await expect(row('snelle_drain_reversal').locator('.mosje-select-name')).toHaveText('Drain Reversal · 2 Energy');
	await expect(row('snelle_the_protector').locator('.mosje-select-mp')).toContainText('loses 30 less');

	// The last row is "No reaction" (the old Pass); there is no cancel button; the rows are big and need no hover.
	const labels = await modal.locator('.modal-mosje-select-btn .mosje-select-name').allInnerTexts();
	expect(labels[labels.length - 1]).toBe('No reaction');
	await expect(row('__pass__')).toHaveText('No reaction');
	await expect(page.locator('#modal-option-cancel'), 'no cancel button').toHaveCount(0);
	await expect(modal.locator('button', { hasText: /^Pass$/ })).toHaveCount(0);
	await page.waitForTimeout(500); // the pop-in animation settles before the rows are measured
	for (const h of await rowHeights(page)) expect(h, 'every row is at least 56 px high').toBeGreaterThanOrEqual(56);
	const box = await modal.boundingBox();
	expect(Math.abs(box.x + box.width / 2 - 960), 'a centred card on desktop').toBeLessThan(2);
	fs.mkdirSync('tests/ui/screenshots/board-2-0', { recursive: true });
	await page.screenshot({ path: 'tests/ui/screenshots/board-2-0/u6-reaction.png' });

	await answerReaction(page, '__pass__');
	await settled(page);
	expect(await myMp(page), 'No reaction takes the full loss').toBe(50 - power);
});

test('g: under 600 px wide the reaction prompt is a bottom sheet with full-width rows of at least 56 px', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page, ['snelle_the_protector'], 3);
	await page.setViewportSize({ width: 390, height: 844 });
	await botAttacks(page);
	const modal = page.locator('.modal-card--reaction');
	await modal.waitFor({ state: 'visible', timeout: 8000 });
	await page.waitForTimeout(500);
	const box = await modal.boundingBox();
	expect(box.x, 'flush with the left edge').toBeLessThan(1);
	expect(box.width, 'the full width').toBeGreaterThan(388);
	expect(Math.abs(box.y + box.height - 844), 'sitting on the bottom edge').toBeLessThan(2);
	for (const h of await rowHeights(page)) expect(h).toBeGreaterThanOrEqual(56);
	await answerReaction(page, '__pass__');
	await settled(page);
});
