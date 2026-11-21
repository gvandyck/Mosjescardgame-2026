/**
 * hidden-info.spec.js - EFX-07 on the live board (Phase 60-07). A reveal reaches only the entitled viewer:
 *  a) human plays Chef's Special with Ronald: the read-only reveal modal lists the bot's whole hand
 *  b) human plays Stookerino with a Binti on the field: the read-only reveal lists the bot's hand, state.revealed is the human's only (b2: no Binti, no reveal)
 *  c) bot uses FPS West: the human gets no reveal modal, nothing of the human hand leaks (the bot's own answer is Leave it)
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

test('a: Chef\'s Special with Ronald shows the human a read-only reveal of the bot\'s whole hand', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page, { own: 'mosje_ronald_chef', oppHand: [...OPP_HAND, 'snelle_jensen'] });
	await readyPiecie(page, 'piecie_chefs_special');
	await activatePiecieOnField(page, 'piecie_chefs_special');
	await expect(page.locator(REVEAL_ROW).first()).toBeVisible({ timeout: 8000 });
	const names = (await page.locator(REVEAL_ROW).allInnerTexts()).join('|');
	expect(names).toMatch(/Pot of Weed/i);
	expect(names).toMatch(/Harde Didde/i);
	expect(names).toMatch(/Jensen/i); // the whole hand is shown, not only the Piecies (Gandalf 2026-10-18)
	const gs = await getGameState(page);
	expect(gs.revealed?.player_1?.length).toBe(1);
	expect(gs.revealed?.player_2).toBeUndefined();
});

test('b: Stookerino with a Binti on the field shows the human the bot hand in the read-only reveal', async ({ page }) => {
	// Card text: "Your opponent discards 1 card of their choice. With a Binti on your field: look at their hand first."
	test.setTimeout(60000);
	await boot(page, { own: 'mosje_binti' });
	await readyPiecie(page, 'piecie_stookerino');
	await activatePiecieOnField(page, 'piecie_stookerino');
	await expect(page.locator(REVEAL_ROW).first()).toBeVisible({ timeout: 8000 });
	const names = (await page.locator(REVEAL_ROW).allInnerTexts()).join('|');
	expect(names).toMatch(/Harde Didde/i);
	expect(names).toMatch(/Pot of Weed/i);
	const gs = await getGameState(page);
	expect(gs.revealed?.player_1?.length).toBeGreaterThan(0); // the human looked
	expect(gs.revealed?.player_2).toBeUndefined(); // the bot saw nothing
});

test('b2: Stookerino without a Binti shows no reveal; the bot still discards 1 card of its own choice', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await readyPiecie(page, 'piecie_stookerino');
	await activatePiecieOnField(page, 'piecie_stookerino');
	await expect.poll(async () => (await getGameState(page)).players.player_2.hand.length, { timeout: 10000 }).toBe(1);
	await expect(page.locator(REVEAL_ROW)).toHaveCount(0);
	const gs = await getGameState(page);
	expect(gs.revealed?.player_1).toBeUndefined();
	expect(gs.revealed?.player_2).toBeUndefined();
	expect(gs.players.player_2.graveyard.length).toBeGreaterThan(0);
});

test('c: the bot uses FPS West: the human sees no reveal of their own hand, and the bot (which leaves it) changes nothing public', async ({ page }) => {
	// Card text: "Once per turn: pay 1 Energy; look at your opponent's hand. Then you can have this Mosje lose 20 MP;
	// put 1 card from that hand on the bottom of their deck. They draw 1."
	// The bot's default answer to the optional second half is the first option, "Leave it" (a strategy matter for Phase 73).
	test.setTimeout(60000);
	await boot(page, { oppMosje: 'mosje_fps_west' });
	await setHand(page, 'player_1', ['piecie_kannetje_melk', 'piecie_affoe']);
	const deckBefore = (await getGameState(page)).players.player_1.deck.length;
	const res = await page.evaluate(() => window.__testHooks.botUseAbility('mosje_fps_west', {}));
	expect(res).toBe('ok');
	await page.waitForTimeout(600);
	await expect(page.locator(REVEAL_ROW)).toHaveCount(0);
	await expect(page.locator('.modal-card')).toHaveCount(0); // no pause of the bot's reached the human
	const gs = await getGameState(page);
	expect(gs.revealed?.player_2?.[0]?.cardIds).toEqual(['piecie_kannetje_melk', 'piecie_affoe']); // the bot saw the hand
	expect(gs.revealed?.player_1).toBeUndefined(); // the human saw nothing of the bot's
	expect(gs.pendingChoice, 'the bot answered its own pause').toBeUndefined();
	expect(gs.players.player_2.activeSlots[0].mp, 'Leave it costs no MP').toBe(40);
	expect(gs.players.player_1.hand.map((c) => c.cardId)).toEqual(['piecie_kannetje_melk', 'piecie_affoe']);
	expect(gs.players.player_1.deck.length).toBe(deckBefore);
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
