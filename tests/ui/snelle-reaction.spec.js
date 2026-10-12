/**
 * snelle-reaction.spec.js - U6: human Snelle reaction prompt on the live board (Phase 57, TABLE-04).
 * The bot attacks through the real playBotSteps path (testMode hook botAttack); the human sees a 'Reaction'
 * prompt only with a fitting Snelle, a free Piecie slot and enough Energy. Own-side: Sleutelpuntje before a Quest roll.
 */
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setHand, setEnergy, setQuestFaceUp, setNextDice, clickModalOption,
} from './helpers.js';
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
	await page.click('#btn-quest');
	await clickModalOption(page, '0');
	await clickModalOption(page, 'FIGHTING');
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
