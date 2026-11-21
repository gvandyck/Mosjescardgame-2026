/**
 * phone-turn.spec.js - Phase 65-09 (MOB-04; D-13, D-14, D-19 b): a whole human turn is played on a phone by real touch taps and nothing
 * else, at 390x844, 360x740 and Gandalf's Pixel 8 Pro (395x731). It mirrors tap-only-turn.spec.js step by step, but through the phone
 * bar and the hand drawer: (1) the Draw step sheet when it opens; (2) open the drawer, raise Fissa, tap the gold "Place here" slot;
 * (3) raise Kannetje Melk, Play; (4) attack with Confirm; (5) Quest through the sheets; (6) Activate the Doner and answer its pick
 * sheet; (7) End Turn in the bar, the bot plays, then End Turn asks first (the confirm sheet, "Keep playing"); (8) a bot attack opens
 * the reaction sheet, "No reaction". Every step is asserted in
 * getGameState (never done by a hook); after every step the page does not scroll sideways and the bar is on screen. Only the testMode
 * seeders set the stage. Emulation proves layout, taps and the engine effects; only Gandalf's phone proves tap accuracy.
 */
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setHand, setEnergy, clearEntryProtection } from './helpers.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { FISSA, KANNETJE, DONER, seedPhoneTurnBoard } from '../helpers/phoneTurnBoard.js';
import { hintOf, raiseCard } from '../helpers/phoneRaise.js';
import { attackByTap, beginQuestByTap, clickThroughOptions, activateByTap, press } from '../helpers/boardTaps.js';
import { hitTestPlaceHere } from '../helpers/hitTestPlaceHere.js';
import { answerDrawStep } from '../helpers/answerDrawStep.js';
import { expectBottomSheet } from '../helpers/expectBottomSheet.js';
import { expectPhoneStable } from '../helpers/expectPhoneStable.js';
import { touchEndTurn } from '../helpers/touchEndTurn.js';
import { waitForMyTurnByTouch } from '../helpers/waitForMyTurnByTouch.js';
import { getCardEnergyCost } from '../../src/engine/energy/getCardEnergyCost.js';

const TOUCH = { touch: true };
const mp = (gs, pid, i) => gs.players[pid].activeSlots[i]?.mp;
const me = (gs) => gs.players.player_1;

for (const vp of [...PHONE_VIEWPORTS, PIXEL_VIEWPORT]) {
	test.describe(`a whole phone turn by touch at ${vp.name}`, () => {
		test.use(phoneUse(vp));

		test('Draw step, raise + gold slot, raise + Play, attack, Quest, Activate, End Turn, reaction: touch only', async ({ page }) => {
			test.setTimeout(150000);
			const errors = [];
			page.on('pageerror', (err) => errors.push(err.message));
			await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
			await page.goto(GAME_URL_TEST);
			await waitForBoard(page);
			expect(await page.evaluate(() => navigator.maxTouchPoints), 'a real touch context').toBeGreaterThan(0);

			// 1. The Draw step prompt (when this opening has one) is a bottom sheet; "Draw normally" is tapped.
			const sawDraw = await answerDrawStep(page);
			console.log(`[65-09] ${vp.name}: the Draw step ${sawDraw ? 'opened and was answered' : 'did not open in this game'}`);
			await seedPhoneTurnBoard(page);
			await expectPhoneStable(page, '(1) start');
			let gs = await getGameState(page);
			expect(me(gs).energy, 'the stage: 6 Energy').toBe(6);

			// 2. Open the drawer, raise Fissa: the gold slot marks Mosje slot 1 and stays on top; TAP the gold slot.
			await raiseCard(page, FISSA);
			await expect(hintOf(page), 'exactly one marked slot').toHaveCount(1);
			await expect(hintOf(page)).toHaveAttribute('data-slot-kind', 'mosje');
			await expect(hintOf(page)).toHaveAttribute('data-slot-index', '1');
			const hit = await hitTestPlaceHere(page);
			console.log(`[65-09] ${vp.name}: "Place here" hit-test ${JSON.stringify(hit)}`);
			expect(hit.ok, `the marked slot stays visible and on top: ${JSON.stringify(hit)}`).toBe(true);
			await expectPhoneStable(page, '(2) raised');
			await hintOf(page).tap();
			await expect.poll(async () => me(await getGameState(page)).activeSlots[1]?.cardId, 'engine: Fissa sits in slot 1').toBe(FISSA);
			gs = await getGameState(page);
			expect(me(gs).energy, 'Fissa was paid for').toBe(6 - getCardEnergyCost(FISSA));
			expect(me(gs).hand.some((c) => c.cardId === FISSA), 'Fissa left the hand').toBe(false);
			await clearEntryProtection(page); // a fresh Mosje may not act yet; the turn needs her Quest
			await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'main');
			await expectPhoneStable(page, '(2) Fissa played');

			// 3. Raise the Piecie, Play: it lands in the first free Piecie slot (slot 0 holds the Doner, so slot 1).
			const energyBeforePiecie = me(gs).energy;
			await raiseCard(page, KANNETJE);
			await expect(hintOf(page)).toHaveAttribute('data-slot-kind', 'piecie');
			await page.locator('[data-raise-play]').tap();
			await expect.poll(async () => me(await getGameState(page)).piecieSlots[1]?.cardId, 'engine: Kannetje Melk sits in Piecie slot 1').toBe(KANNETJE);
			gs = await getGameState(page);
			expect(me(gs).energy, 'the Piecie was paid for').toBe(energyBeforePiecie - getCardEnergyCost(KANNETJE));
			await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'main');
			await expectPhoneStable(page, '(3) Piecie played');

			// 4. Attack with Bulldozer: tile, Attack, the target, Confirm in the strip.
			const power = await page.evaluate(() => window.__testHooks.getMosjePower('player_1', 0));
			const targetMp = mp(gs, 'player_2', 0);
			await attackByTap(page, { slot: 0, target: 'player_2:0', ...TOUCH });
			gs = await getGameState(page);
			expect(mp(gs, 'player_2', 0), 'engine: the target lost the attacker Power').toBe(targetMp - power);
			await expectPhoneStable(page, '(4) attack');

			// 5. Quest with Fissa: tile, Quest, the Quest tile, then the sheets (cost / dice / result).
			const fissaMp = mp(gs, 'player_1', 1);
			await beginQuestByTap(page, 1, TOUCH);
			await press(page.locator('.quest-stack[data-quest-stack="FIGHTING"]'), TOUCH);
			await expectBottomSheet(page, 'Quest sheet');
			await clickThroughOptions(page, [], 8, TOUCH);
			gs = await getGameState(page);
			expect(mp(gs, 'player_1', 1), 'engine: Quest win +25').toBe(fissaMp + 25);
			expect(gs.questStacks.FIGHTING.faceUp, 'engine: the next Quest turned face-up').not.toBe('quest_tough_it_out');
			await expectPhoneStable(page, '(5) Quest');

			// 6. Activate the Doner from its tray; its target pick is a sheet, answered by touch.
			const sumBefore = mp(gs, 'player_1', 0) + mp(gs, 'player_1', 1);
			const energyBeforeDoner = me(gs).energy;
			await activateByTap(page, DONER, TOUCH);
			await expectBottomSheet(page, 'Doner pick');
			await clickThroughOptions(page, [], 3, TOUCH);
			await expect.poll(async () => me(await getGameState(page)).piecieSlots.some((s) => s && s.cardId === DONER), 'engine: the Doner is spent').toBe(false);
			gs = await getGameState(page);
			expect(me(gs).energy, 'engine: Broodje costs 1').toBe(energyBeforeDoner - 1);
			expect(mp(gs, 'player_1', 0) + mp(gs, 'player_1', 1), 'engine: one Mosje gained 35').toBe(sumBefore + 35);
			expect(me(gs).graveyard.some((c) => c.cardId === DONER), 'the Doner went to the discard').toBe(true);
			await expectPhoneStable(page, '(6) Activate');

			// 7. End Turn in the bar (the confirm sheet is tapped when it opens); the bot plays its whole turn.
			const asked = await touchEndTurn(page);
			console.log(`[65-09] ${vp.name}: the "can still act" confirm was ${asked ? 'asked and answered' : 'not asked'}`);
			await waitForMyTurnByTouch(page);
			gs = await getGameState(page);
			expect(gs.activePlayerId, 'engine: it is my turn again').toBe('player_1');
			await expectPhoneStable(page, '(7) End Turn + bot turn');

			// 7b. The new turn starts with Mosjes that can act again, so End Turn asks first: a bottom sheet, "Keep playing" is the way back.
			await expect(page.locator('#btn-end-turn'), 'Mosjes can act again').not.toHaveAttribute('data-actions-left', '0');
			await page.locator('#btn-end-turn').tap();
			await expectBottomSheet(page, 'End turn confirm');
			await page.locator('.modal-mosje-select-btn[data-id="keep"]').tap();
			await expect(page.locator('#modal-root .modal-card'), 'the confirm closed').toHaveCount(0);
			expect((await getGameState(page)).activePlayerId, 'Keep playing: still my turn').toBe('player_1');
			await expectPhoneStable(page, '(7b) End turn confirm answered');

			// 8. A bot attack opens the reaction prompt as a bottom sheet; "No reaction": the full Power loss.
			await setHand(page, 'player_1', ['snelle_the_protector']); // a Snelle that fits, so the game must ask
			await setEnergy(page, 'player_1', 6);
			await setHand(page, 'player_2', []);
			const botPower = await page.evaluate(() => window.__testHooks.getMosjePower('player_2', 0));
			const before = mp(await getGameState(page), 'player_1', 0);
			expect(await page.evaluate(() => window.__testHooks.botAttack(0, 0)), 'the bot attacks').toBe('ok');
			const prompt = page.locator('.modal-card--reaction');
			await expect(prompt).toBeVisible({ timeout: 8000 });
			await expect(prompt).toContainText('attacks');
			await expectBottomSheet(page, 'Reaction prompt');
			await prompt.locator('.modal-mosje-select-btn[data-id="__pass__"]').tap();
			await expect.poll(async () => {
				const g = await getGameState(page);
				return g.pendingReaction == null && g.activePlayerId === 'player_1';
			}, { timeout: 15000 }).toBe(true);
			gs = await getGameState(page);
			expect(mp(gs, 'player_1', 0), 'engine: No reaction, the full Power loss').toBe(before - botPower);
			expect(me(gs).hand.some((c) => c.cardId === 'snelle_the_protector'), 'the Snelle stayed in hand').toBe(true);
			await expectPhoneStable(page, '(8) reaction answered');

			expect(errors, 'no page errors during the whole turn').toEqual([]);
		});
	});
}
