/**
 * tap-only-turn.spec.js - Mobile-ready rule (a), D-21 (63-08): a whole human turn is played with real touch taps and no hover:
 * attack (tray -> target -> Confirm), Quest (tray -> Quest tile -> picker modals), play the Place from the hand, Activate a
 * Piecie from its tray, End Turn, then answer a bot attack's Reaction prompt with "No reaction". The context has hasTouch, so
 * every press is locator.tap() (tests/helpers/boardTaps.js, { touch: true }); the pointer is never moved or hovered in this file.
 * Only the testMode seeders (board, hand, Energy, face-up Quest, forced dice, botAttack) set the stage; every state change is asserted
 * in getGameState. A second test proves the test hooks do not exist on a normal game URL (T-63-13).
 *
 * Why the hand is almost always empty here: styles/card-v1.css sinks the hand only under `@media (hover: hover)`, and a hasTouch
 * context is `hover: none`, so the hand stands at full height over the board. That phone / touch hand layout is Phase 65
 * (swipe-up drawer); this proof keeps the hand empty except for the one Place card it taps, so nothing covers a tile.
 */
import { test, expect } from '@playwright/test';
import {
	GAME_URL, GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setHand, setEnergy, setQuestFaceUp, setNextDice, unlockPiecies,
} from './helpers.js';
import { attackByTap, questByTap, activateByTap, clickThroughOptions, press } from '../helpers/boardTaps.js';
import { getPower } from '../../src/engine/mp/getPower.js';

test.use({ hasTouch: true, viewport: { width: 1920, height: 1080 } });

const PIECIE = 'piecie_broodje_doner'; // Energy 1: "One of your Mosjes gains 35 MP."
const PLACE = 'place_drain_zone'; // Energy 3: "All Mosjes get +10 Power."
const TOUCH = { touch: true };
const mp = (gs, pid, i) => gs.players[pid].activeSlots[i].mp;

async function seedBoard(page) {
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 }); // Power 20
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_fissa', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_2', 1, null);
	await clearEntryProtection(page); // own Mosjes are not Fresh, the target is attackable
	await setHand(page, 'player_1', []);
	await setHand(page, 'player_2', []);
	await page.evaluate((id) => window.__testHooks.setPiecieOnField('player_1', 0, id, { faceDown: true }), PIECIE);
	await unlockPiecies(page, 'player_1'); // a ready Piecie
	await setEnergy(page, 'player_1', 6);
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await setNextDice(page, [6, 6, 6, 6, 6, 6]);
}

/** End Turn by tap; the "A Mosje can still act" confirm is answered by tap when the game asks it. Returns whether it was asked. */
async function tapEndTurn(page) {
	await press(page.locator('#btn-end-turn'), TOUCH);
	const end = page.locator('.modal-mosje-select-btn[data-id="end"]').first();
	const asked = await end.waitFor({ state: 'visible', timeout: 1000 }).then(() => true, () => false);
	if (asked) await press(end, TOUCH);
	return asked;
}

/** Wait (tapping away anything that blocks) until the bot's turn has played and it is the human's turn again. */
async function waitForMyTurn(page) {
	const noReaction = page.locator('.modal-card--reaction .modal-mosje-select-btn[data-id="__pass__"]');
	const drawStep = page.locator('.modal-mosje-select-btn[data-id="draw"]');
	let sawBot = false;
	await expect.poll(async () => {
		if (await noReaction.isVisible().catch(() => false)) await press(noReaction, TOUCH).catch(() => {});
		if (await drawStep.isVisible().catch(() => false)) await press(drawStep.first(), TOUCH).catch(() => {});
		const gs = await getGameState(page);
		if (gs.activePlayerId === 'player_2') sawBot = true;
		return sawBot && gs.activePlayerId === 'player_1' && !(await page.locator('#btn-end-turn').isDisabled());
	}, { timeout: 40000, intervals: [200] }).toBe(true);
}

test('a whole turn is played with taps only: attack, Quest, Place, Piecie Activate, End Turn, reaction answer', async ({ page }) => {
	test.setTimeout(150000);
	const errors = [];
	page.on('pageerror', (err) => errors.push(err.message));
	await seedBoard(page);
	expect(await page.evaluate(() => navigator.maxTouchPoints), 'a real touch context').toBeGreaterThan(0);
	let gs = await getGameState(page);
	const power = getPower(gs.players.player_1.activeSlots[0]);
	expect(power).toBe(20);

	// 1. Attack: tap Alyssa, Attack in the tray, tap the target, Confirm in the strip.
	await attackByTap(page, { slot: 0, target: 'player_2:0', ...TOUCH });
	gs = await getGameState(page);
	expect(mp(gs, 'player_2', 0), 'the target lost the attacker Power').toBe(60 - power);

	// 2. Quest: tap the other Mosje, Quest in its tray, the FIGHTING Quest tile, then the cost / dice / result modals.
	await questByTap(page, { slot: 1, stackId: 'FIGHTING', ...TOUCH });
	gs = await getGameState(page);
	expect(mp(gs, 'player_1', 1), 'Quest win: +25').toBe(40 + 25);
	expect(gs.questStacks.FIGHTING.faceUp, 'the next Quest turned face-up').not.toBe('quest_tough_it_out');

	// 3. Place: the hand card is tapped (it plays and pays its Energy).
	await setHand(page, 'player_1', [PLACE]);
	await press(page.locator(`.hand-card-wrap[data-card-id="${PLACE}"]`).first(), TOUCH);
	await expect.poll(async () => (await getGameState(page)).activePlace).toBe(PLACE);
	gs = await getGameState(page);
	expect(gs.activePlacePlayedBy).toBe('player_1');
	expect(gs.players.player_1.energy, 'Drain Zone costs 3').toBe(3);
	expect(gs.players.player_1.hand.some((c) => c.cardId === PLACE), 'the Place left the hand').toBe(false);
	await expect(page.locator(`#board-place [data-card-id="${PLACE}"]`)).toBeVisible();

	// 4. Activate: tap the ready Piecie, Activate in its tray; its target pick (which Mosje gains 35) is a tap too.
	const mpSum = (g) => mp(g, 'player_1', 0) + mp(g, 'player_1', 1);
	const sumBefore = mpSum(gs);
	await activateByTap(page, PIECIE, TOUCH);
	await clickThroughOptions(page, [], 3, TOUCH);
	await expect.poll(async () => (await getGameState(page)).players.player_1.piecieSlots.some((s) => s && s.cardId === PIECIE)).toBe(false);
	gs = await getGameState(page);
	expect(gs.players.player_1.energy, 'Broodje costs 1').toBe(2);
	expect(mpSum(gs), 'one Mosje gained 35').toBe(sumBefore + 35);
	expect(gs.players.player_1.graveyard.some((c) => c.cardId === PIECIE)).toBe(true);

	// 5. End Turn: the bot plays its whole turn, then the board is mine again.
	await tapEndTurn(page);
	await waitForMyTurn(page);
	gs = await getGameState(page);
	expect(gs.activePlayerId).toBe('player_1');

	// 6. Reaction: a bot attack opens the Reaction prompt (The Protector fits, Energy and a free Piecie slot are there); tap "No reaction".
	await setHand(page, 'player_1', ['snelle_the_protector']);
	await setEnergy(page, 'player_1', 6);
	await setHand(page, 'player_2', []);
	const botPower = await page.evaluate(() => window.__testHooks.getMosjePower('player_2', 0));
	const before = mp(await getGameState(page), 'player_1', 0);
	expect(await page.evaluate(() => window.__testHooks.botAttack(0, 0))).toBe('ok');
	const prompt = page.locator('.modal-card--reaction');
	await expect(prompt).toBeVisible({ timeout: 8000 });
	await expect(prompt).toContainText('attacks');
	await press(prompt.locator('.modal-mosje-select-btn[data-id="__pass__"]'), TOUCH);
	await expect.poll(async () => {
		const g = await getGameState(page);
		return g.pendingReaction == null && g.activePlayerId === 'player_1';
	}, { timeout: 15000 }).toBe(true);
	expect(mp(await getGameState(page), 'player_1', 0), 'No reaction: the full Power loss').toBe(before - botPower);
	expect((await getGameState(page)).players.player_1.hand.some((c) => c.cardId === 'snelle_the_protector'), 'the Snelle stayed in hand').toBe(true);

	expect(errors, 'no page errors during the turn').toEqual([]);
});

test('T-63-13: a normal game URL (no testMode) has no test hooks', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL);
	await waitForBoard(page);
	expect(await page.evaluate(() => typeof window.__testHooks)).toBe('undefined');
});
