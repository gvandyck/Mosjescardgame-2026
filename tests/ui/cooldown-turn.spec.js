/**
 * cooldown-turn.spec.js - U8: the cooldown turn on the 2.0 board (UI-05, Phase 63-07, D-19, RULE-07).
 * A deck-out draw makes the player's turn a cooldown turn. The status strip stays up for the WHOLE turn; Attack, Quest and
 * Ability are greyed tray chips whose tap says why; a hand Mosje, Place and Snelle do not play and say why; a hand Piecie
 * still goes down face-down (and the strip does not change); End Turn ends the turn at once (nothing can act).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection, setHand, setEnergy,
	injectGraveyardCard, playCardFromHand,
} from './helpers.js';
import { tapOwnCard, chooseTray, cancelSelection } from '../helpers/boardTaps.js';
import { clickEndTurn } from '../helpers/clickEndTurn.js';

const SHOT_DIR = 'tests/ui/screenshots/board-2-0';
const COOLDOWN_TEXT = 'Cooldown turn: you can only place face-down Piecies';
const strip = (page) => page.locator('#status-strip');
const toast = (page) => page.locator('#board-toast');
const handPlayBtn = (page, cardId) => page.locator(`.hand-card-wrap[data-card-id="${cardId}"] .hand-card__play-btn`).first();

async function bootCooldownTurn(page) {
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_ronald_chef', { mp: 40, level: 1 }); // has an Ability chip (2 Energy)
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_destroyer', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	await setHand(page, 'player_1', []);
	await setHand(page, 'player_2', []);
	// Deck-out: an empty deck with cards in the discard pile reshuffles on the next draw and sets the cooldown turn.
	await page.evaluate(() => window.__testHooks.emptyDeck('player_1'));
	await injectGraveyardCard(page, 'player_1', 'piecie_affoe');
	await injectGraveyardCard(page, 'player_1', 'piecie_affoe');
	await page.evaluate(() => window.__testHooks.runTurnBoundary('start', 'player_1'));
	await setHand(page, 'player_1', ['piecie_affoe', 'place_drain_zone', 'snelle_the_protector', 'mosje_alyssa_fissa']);
	await setEnergy(page, 'player_1', 6);
	await page.mouse.move(2, 2);
}

test('U8: the cooldown strip stays up the whole turn and every control but a face-down Piecie is greyed with its reason', async ({ page }) => {
	test.setTimeout(120000);
	await bootCooldownTurn(page);
	let gs = await getGameState(page);
	expect(gs.players.player_1.cooldownTurn, 'engine: cooldown turn after the deck-out draw').toBe(true);
	expect(gs.activePlayerId).toBe('player_1');

	// The strip: kind and copy, and End Turn offers no "actions left" hint (nothing can act).
	await expect(strip(page)).toHaveAttribute('data-status-kind', 'cooldown');
	await expect(strip(page)).toHaveText(COOLDOWN_TEXT);
	await expect(page.locator('#btn-end-turn')).toHaveAttribute('data-actions-left', '0');
	await expect(page.locator('#btn-end-turn .end-turn__hint')).toHaveCount(0);

	// Tray: Attack, Quest and Ability are dimmed (aria-disabled) and a tap shows the cooldown reason.
	await tapOwnCard(page, 'mosje', 0);
	for (const action of ['attack', 'quest']) {
		await expect(page.locator(`[data-action-tray] [data-action="${action}"]`)).toHaveAttribute('aria-disabled', 'true');
	}
	await chooseTray(page, 'attack', { force: true });
	await expect(toast(page)).toContainText(/Cooldown turn/);
	await chooseTray(page, 'quest', { force: true });
	await expect(toast(page)).toContainText(/Cooldown turn/);
	expect((await getGameState(page)).players.player_2.activeSlots[0].mp, 'no attack happened').toBe(60);
	await cancelSelection(page);

	await tapOwnCard(page, 'mosje', 1);
	const ability = page.locator('[data-action-tray] [data-action="ability"]');
	await expect(ability).toHaveAttribute('aria-disabled', 'true');
	await ability.hover(); // a greyed chip can never spend, so it shows no spend preview on the crystals
	await expect(page.locator('#energy-player .energy-crystals')).not.toHaveAttribute('data-preview', 'spend');
	await chooseTray(page, 'ability', { force: true });
	await expect(toast(page)).toContainText(/Cooldown turn/);
	expect((await getGameState(page)).players.player_1.energy, 'no Energy spent on the greyed Ability').toBe(6);
	await expect(strip(page), 'the strip is still the cooldown message').toHaveAttribute('data-status-kind', 'cooldown');
	await cancelSelection(page);

	// The screenshot for Gandalf: the strip, the greyed tray chips with the reason toast, and the greyed hand (the deck-recycle
	// banner has gone by now; the strip is what stays).
	await page.locator('.deckout-banner').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
	await tapOwnCard(page, 'mosje', 0);
	await chooseTray(page, 'attack', { force: true });
	await page.mouse.move(2, 2);
	await expect(toast(page)).toContainText(/Cooldown turn/);
	await page.waitForTimeout(600); // the toast fade-in settles
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/u8-cooldown.png` });
	await cancelSelection(page);

	// Hand: the Place, the Snelle and the Mosje have a disabled play button with the reason, only the Piecie can be played.
	for (const id of ['place_drain_zone', 'snelle_the_protector', 'mosje_alyssa_fissa']) {
		await expect(handPlayBtn(page, id), `${id} play button`).toBeDisabled();
		await expect(handPlayBtn(page, id)).toHaveAttribute('title', COOLDOWN_TEXT);
		await expect(page.locator(`.hand-card-wrap[data-card-id="${id}"] .hand-card`)).toHaveClass(/hand-card--not-playable/);
	}
	await expect(handPlayBtn(page, 'piecie_affoe')).toBeEnabled();

	// A tap on each blocked card says why and plays nothing.
	for (const id of ['place_drain_zone', 'snelle_the_protector', 'mosje_alyssa_fissa']) {
		await page.evaluate(() => document.getElementById('board-toast')?.remove());
		await playCardFromHand(page, id);
		await expect(toast(page), `${id} toast`).toHaveText(COOLDOWN_TEXT);
		await expect(page.locator('.modal-card'), 'no preview or error modal opens').toHaveCount(0);
	}
	gs = await getGameState(page);
	expect(gs.activePlace, 'the Place did not play').toBeNull();
	expect(gs.players.player_1.energy, 'no Energy spent').toBe(6);
	expect(gs.players.player_1.activeSlots.filter(Boolean), 'no Mosje was summoned').toHaveLength(2);
	expect(gs.players.player_1.hand.map((c) => c.cardId).sort(), 'all four cards still in hand').toEqual(['mosje_alyssa_fissa', 'piecie_affoe', 'place_drain_zone', 'snelle_the_protector']);

	// A Piecie still goes down face-down, and the strip does not change.
	await playCardFromHand(page, 'piecie_affoe');
	await expect.poll(async () => (await getGameState(page)).players.player_1.piecieSlots.filter(Boolean).length).toBe(1);
	gs = await getGameState(page);
	expect(gs.players.player_1.piecieSlots.find(Boolean).faceDown, 'placed face-down').toBe(true);
	await expect(strip(page), 'the strip stays up after the placement').toHaveAttribute('data-status-kind', 'cooldown');
	await expect(strip(page)).toHaveText(COOLDOWN_TEXT);

	// End Turn works at once (no confirm: nothing can act), the bot plays and the cooldown ends with the turn.
	await setHand(page, 'player_1', []);
	const turnBefore = gs.turnNumber;
	expect(await clickEndTurn(page), 'no confirm on a cooldown turn').toBe(false);
	await page.waitForFunction((m) => {
		const s = window.__testHooks?.getGameState();
		const btn = document.getElementById('btn-end-turn');
		return s && s.turnNumber > m && s.activePlayerId === 'player_1' && btn && btn.disabled === false;
	}, turnBefore, { timeout: 60000 });
	gs = await getGameState(page);
	expect(gs.players.player_1.cooldownTurn, 'the cooldown ended with the turn').toBeFalsy();
	await expect(strip(page)).not.toHaveAttribute('data-status-kind', 'cooldown');
});
