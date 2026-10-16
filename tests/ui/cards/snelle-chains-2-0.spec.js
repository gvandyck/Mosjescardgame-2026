/**
 * snelle-chains-2-0.spec.js - Handoff section 6b on the real game, headless (Phase 60, EFX-03):
 *  (a) Jensen! -> Frenssen! -> Blensen!: Blensen! is free after the Jensen!, the hit fizzles, Blensen! stays in its slot;
 *  (b) Harde Didde / Klaar Met Jou (send an opponent Mosje to the Welloe pile) are answered by Not Today! and by Jensen!.
 * The bot activates the Piecie (test hook botActivatePiecie) and answers windows with its own policy (Frenssen! over a Jensen!).
 * Run headless only: npx playwright test -c <temporary headless config> tests/ui/cards/snelle-chains-2-0.spec.js
 */
import { test, expect } from '@playwright/test';
import { getGameState } from '../helpers.js';
import { mosjeCardSetup } from '../../helpers/mosjeCardSetup.js';
import { answerReaction, expectNoReactionPrompt } from '../../helpers/reactionUi.js';

const MING = 'mosje_ming_predictor';
const AFFOE = 'piecie_affoe'; // human Mosje -15, the bot's own Mosje +10
const inDiscard = (state, pid, id) => state.players[pid].graveyard.some(c => c.cardId === id);
const activate = (page, cardId) => page.evaluate((id) => window.__testHooks.botActivatePiecie(id, {}), cardId);

test('Jensen! -> Frenssen! -> Blensen!: Blensen! is free, the Affoe fizzles, only Frenssen!\'s 10 lands', async ({ page }) => {
	test.setTimeout(90000);
	await mosjeCardSetup(page, { mosje: 'snelle_jensen' }, { setup: {
		field: [{ id: MING, mp: 40 }], oppField: [{ id: MING, mp: 40 }],
		hand: ['snelle_jensen', 'snelle_blensen'], oppHand: ['snelle_frenssen'], energy: 3,
	} });
	await activate(page, AFFOE);
	await answerReaction(page, 'snelle_jensen'); // Blensen! costs 4 now, so only Jensen! is offered
	await answerReaction(page, 'snelle_blensen'); // the bot's Frenssen! cancelled the Jensen!; Blensen! is free after a Jensen!/Frenssen!
	await expectNoReactionPrompt(page, 1500);
	const s = await getGameState(page);
	expect(s.players.player_1.activeSlots[0].mp, 'Frenssen! cost the Jensen! player 10, the Affoe did nothing').toBe(30);
	expect(s.players.player_2.activeSlots[0].mp, 'the cancelled Affoe gave the bot nothing').toBe(40);
	expect(s.players.player_1.energy, 'Jensen! 1, Blensen! free').toBe(2);
	expect(s.players.player_2.energy, 'Affoe 1 + Frenssen! 2 stay spent').toBe(3);
	expect(inDiscard(s, 'player_2', AFFOE), 'Affoe in the bot discard pile').toBe(true);
	expect(inDiscard(s, 'player_2', 'snelle_frenssen'), 'Frenssen! in the bot discard pile').toBe(true);
	expect(inDiscard(s, 'player_1', 'snelle_jensen'), 'Jensen! in my discard pile').toBe(true);
	expect(s.players.player_1.piecieSlots.some(e => e?.cardId === 'snelle_blensen'), 'Blensen! stays in its slot').toBe(true);
	expect(s.blensenShield.playerId).toBe('player_1');
});

const LEVEL2_BOT = [{ id: MING, mp: 40, level: 2 }]; // Harde Didde / Klaar Met Jou: "Needs: one of your Mosjes at Level 2+"

test('Harde Didde on my Mosje is answered by Not Today!: it stays where it is, at 30 MP', async ({ page }) => {
	test.setTimeout(90000);
	await mosjeCardSetup(page, { mosje: 'snelle_negate_elimination' }, { setup: {
		field: [{ id: MING, mp: 30 }], oppField: LEVEL2_BOT, hand: ['snelle_negate_elimination'], energy: 3,
	} });
	await activate(page, 'piecie_harde_didde');
	await answerReaction(page, 'snelle_negate_elimination');
	await expectNoReactionPrompt(page, 1500);
	const s = await getGameState(page);
	expect(s.players.player_1.activeSlots[0]?.mp, 'the Mosje stayed').toBe(30);
	expect(s.players.player_1.welloePile.length, 'nothing went to my Welloe pile').toBe(0);
	expect(s.players.player_1.energy).toBe(1);
});

test('Harde Didde on my Mosje is answered by Jensen!: cancelled, the Mosje stays', async ({ page }) => {
	test.setTimeout(90000);
	await mosjeCardSetup(page, { mosje: 'snelle_jensen' }, { setup: {
		field: [{ id: MING, mp: 30 }], oppField: LEVEL2_BOT, hand: ['snelle_jensen'], energy: 3,
	} });
	await activate(page, 'piecie_harde_didde');
	await answerReaction(page, 'snelle_jensen');
	await expectNoReactionPrompt(page, 1500);
	const s = await getGameState(page);
	expect(s.players.player_1.activeSlots[0]?.mp).toBe(30);
	expect(s.players.player_1.welloePile.length).toBe(0);
	expect(inDiscard(s, 'player_2', 'piecie_harde_didde'), 'Harde Didde in the bot discard pile').toBe(true);
	expect(s.players.player_2.energy, 'its 4 Energy stay spent').toBe(2);
});

test('Klaar Met Jou on my Mosje is answered by Jensen!: no Welloe, and the bot does not draw', async ({ page }) => {
	test.setTimeout(90000);
	await mosjeCardSetup(page, { mosje: 'snelle_jensen' }, { setup: {
		field: [{ id: MING, mp: 30 }], oppField: LEVEL2_BOT, hand: ['snelle_jensen'], energy: 3,
	} });
	const before = await getGameState(page);
	await activate(page, 'piecie_klaar_met_jou');
	await answerReaction(page, 'snelle_jensen');
	await expectNoReactionPrompt(page, 1500);
	const s = await getGameState(page);
	expect(s.players.player_1.activeSlots[0]?.mp).toBe(30);
	expect(s.players.player_1.welloePile.length).toBe(0);
	expect(s.players.player_2.hand.length, 'the cancelled card draws nothing').toBe(before.players.player_2.hand.length);
});

test('Klaar Met Jou on my Mosje is answered by Not Today!: it stays at its MP', async ({ page }) => {
	test.setTimeout(90000);
	await mosjeCardSetup(page, { mosje: 'snelle_negate_elimination' }, { setup: {
		field: [{ id: MING, mp: 20 }], oppField: LEVEL2_BOT, hand: ['snelle_negate_elimination'], energy: 3,
	} });
	await activate(page, 'piecie_klaar_met_jou');
	await answerReaction(page, 'snelle_negate_elimination');
	await expectNoReactionPrompt(page, 1500);
	const s = await getGameState(page);
	expect(s.players.player_1.activeSlots[0]?.mp, 'stays, 5 MP at least').toBe(20);
	expect(s.players.player_1.welloePile.length).toBe(0);
});
