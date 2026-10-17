/**
 * hidden-info.spec.js - EFX-07 on the live board (Phase 60-07). A reveal reaches only the entitled viewer:
 *  a) human plays Chef's Special with Ronald: the read-only reveal modal lists the bot's Piecies
 *  b) human plays Stookerino: the generic pick modal lists the bot's hand (that is the reveal), state.revealed is the human's only
 *  c) bot uses Ronald's Strategic Insight: the human gets no reveal modal, only the set-aside result is public
 *  d) bot activates Those Eyelashes Tho...: the human picks their OWN discard on the generic modal, Snelle is blocked for them
 */
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setHand, setEnergy,
} from './helpers.js';
import { activatePiecieOnField } from '../helpers/piecieUi.js';

const OPP_HAND = ['piecie_pot_of_weed', 'piecie_harde_didde'];
const REVEAL_ROW = '.hand-reveal-name';
const OPTION = '.modal-mosje-select-btn:not([disabled]), .target-option:not([disabled])';

async function boot(page, { own = 'mosje_ming_natural', oppMosje = 'mosje_jeffrey', oppHand = OPP_HAND } = {}) {
	await page.setViewportSize({ width: 1920, height: 1080 });
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	for (const pid of ['player_1', 'player_2']) for (let i = 0; i < 3; i++) await setMosjeOnField(page, pid, i, null);
	await setMosjeOnField(page, 'player_1', 0, own, { mp: 30, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, oppMosje, { mp: 40, level: 1 });
	await clearEntryProtection(page);
	await setEnergy(page, 'player_1', 6);
	await setEnergy(page, 'player_2', 6);
	await setHand(page, 'player_2', oppHand);
}
const readyPiecie = (page, id) => page.evaluate((cardId) => {
	window.__testHooks.setPiecieOnField('player_1', 0, cardId, { faceDown: true });
	window.__testHooks.unlockPiecies('player_1');
}, id);

test('a: Chef\'s Special with Ronald shows the human a read-only reveal of the bot Piecies', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page, { own: 'mosje_ronald_chef' });
	await readyPiecie(page, 'piecie_chefs_special');
	await activatePiecieOnField(page, 'piecie_chefs_special');
	await expect(page.locator(REVEAL_ROW).first()).toBeVisible({ timeout: 8000 });
	const names = (await page.locator(REVEAL_ROW).allInnerTexts()).join('|');
	expect(names).toMatch(/Pot of Weed/i);
	expect(names).toMatch(/Harde Didde/i);
	const gs = await getGameState(page);
	expect(gs.revealed?.player_1?.length).toBe(1);
	expect(gs.revealed?.player_2).toBeUndefined();
});

test('b: Stookerino lists the bot hand on the generic pick modal for the human only', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await readyPiecie(page, 'piecie_stookerino');
	await activatePiecieOnField(page, 'piecie_stookerino');
	await expect(page.locator(OPTION).first()).toBeVisible({ timeout: 8000 });
	const labels = (await page.locator(OPTION).allInnerTexts()).join('|');
	expect(labels).toMatch(/Harde Didde/i);
	await page.locator(OPTION).filter({ hasText: /Harde Didde/i }).first().click();
	await expect.poll(async () => (await getGameState(page)).players.player_2.hand.length, { timeout: 8000 }).toBe(1);
	const gs = await getGameState(page);
	expect(gs.revealed?.player_1?.length).toBeGreaterThan(0);
	expect(gs.revealed?.player_2).toBeUndefined();
	await expect(page.locator(REVEAL_ROW)).toHaveCount(0); // the pick modal was the reveal: no second modal
});

test('c: the bot uses Ronald\'s Strategic Insight: the human sees no reveal of their own hand', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page, { oppMosje: 'mosje_ronald_chef' });
	await setHand(page, 'player_1', ['piecie_kannetje_melk', 'piecie_affoe']);
	const res = await page.evaluate(() => window.__testHooks.botUseAbility('mosje_ronald_chef', { locked_card: 0 }));
	expect(res).toBe('ok');
	await page.waitForTimeout(600);
	await expect(page.locator(REVEAL_ROW)).toHaveCount(0);
	const gs = await getGameState(page);
	expect(gs.revealed?.player_2?.[0]?.cardIds).toEqual(['piecie_kannetje_melk', 'piecie_affoe']); // the bot saw the hand
	expect(gs.revealed?.player_1).toBeUndefined(); // the human saw nothing of the bot's
	expect(gs.players.player_1.setAside?.length).toBe(1); // the public result: one card set aside
	expect(gs.players.player_1.hand.length).toBe(1);
});

test('d: the bot activates Those Eyelashes Tho...: the human picks their own discard, no Snelle for them', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page, { oppMosje: 'mosje_martin_historian' });
	await setHand(page, 'player_1', ['piecie_kannetje_melk', 'piecie_affoe']);
	const res = await page.evaluate(() => window.__testHooks.botActivatePiecie('piecie_those_eyelashes', {}));
	expect(res).toBe('ok');
	await expect(page.locator(OPTION).first()).toBeVisible({ timeout: 10000 });
	const labels = (await page.locator(OPTION).allInnerTexts()).join('|');
	expect(labels).toMatch(/Kannetje Melk/i); // the human's OWN hand
	expect(labels).toMatch(/Affoe/i);
	await page.locator(OPTION).filter({ hasText: /Affoe/i }).first().click();
	await expect.poll(async () => (await getGameState(page)).players.player_1.graveyard.some((c) => c.cardId === 'piecie_affoe'), { timeout: 10000 }).toBe(true);
	const gs = await getGameState(page);
	expect(gs.players.player_1.hand.map((c) => c.cardId)).toEqual(['piecie_kannetje_melk']);
	expect(gs._snelleBlocked).toBe('player_1'); // no Snelle for the human this turn
	await expect(page.locator(REVEAL_ROW)).toHaveCount(0);
});
