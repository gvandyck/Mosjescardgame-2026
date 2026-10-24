/**
 * place-play.spec.js - U7: a Place is played from hand and works at once, only one Place at a time,
 * a destroyer Piecie removes it to its owner's discard (Phase 57, TABLE-05).
 * Drain Zone (Card List): "All Mosjes get +10 Power." Read with getMosjePower on both sides: it applies at once and goes
 * away with the Place (Alyssa, The Bulldozer is Power 20 at Level 1, Ming, The Predictor is Power 10).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setEnergy, setHand, playCardFromHand,
	unlockPiecies, clearEntryProtection, setMosjeOnField,
} from './helpers.js';
import { activatePiecieOnField } from '../helpers/piecieUi.js';

test('Place played from hand sits on the board, pays Energy, blocks a second Place, and a destroyer sends it to the owner discard', async ({ page }) => {
	test.setTimeout(90000);
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 50, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_ming_predictor', { mp: 40, level: 1 });
	await clearEntryProtection(page);
	const power = (pid) => page.evaluate((p) => window.__testHooks.getMosjePower(p, 0), pid);
	expect(await power('player_1'), 'own Power before the Place').toBe(20);
	expect(await power('player_2'), 'opponent Power before the Place').toBe(10);
	await setHand(page, 'player_1', ['place_drain_zone', 'place_momentum_stabilizer']);
	await setEnergy(page, 'player_1', 6);

	await playCardFromHand(page, 'place_drain_zone');
	await expect.poll(async () => (await getGameState(page)).activePlace).toBe('place_drain_zone');
	let gs = await getGameState(page);
	expect(gs.players.player_1.energy, 'Drain Zone costs 3').toBe(3);
	expect(gs.activePlacePlayedBy).toBe('player_1');
	// 63-03: the Place takes no slot. It sits in the middle strip's Place tile with an owner chip, and the felt takes its tint.
	const placeTile = page.locator('#board-place [data-card-id="place_drain_zone"]');
	await expect(placeTile).toBeVisible();
	await expect(placeTile).toHaveAttribute('data-place-owner', 'player_1');
	await expect(placeTile.locator('.place-owner-chip')).toContainText('YOU');
	await expect(page.locator('#piecies-player [data-card-id="place_drain_zone"]'), 'no Piecie slot is used').toHaveCount(0);
	await expect(page.locator('body')).toHaveClass(/place-active/);
	expect(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--place-tint').trim()), 'felt tint set').not.toBe('');
	await page.mouse.move(2, 2);
	await page.waitForTimeout(800); // the 0.6 s felt fade settles
	fs.mkdirSync('tests/ui/screenshots/board-2-0', { recursive: true });
	await page.screenshot({ path: 'tests/ui/screenshots/board-2-0/u7-place.png' });
	expect(await power('player_1'), 'Drain Zone: own Mosje +10 Power').toBe(30);
	expect(await power('player_2'), 'Drain Zone: opponent Mosje +10 Power').toBe(20);

	// Second Place: its play button is disabled and explains why; nothing changes.
	const wrap = page.locator('.hand-card-wrap[data-card-id="place_momentum_stabilizer"]').first();
	await wrap.hover({ position: { x: 100, y: 30 } });
	const btn = wrap.locator('.hand-card__play-btn');
	await expect(btn).toBeDisabled();
	await expect(btn).toHaveAttribute('title', 'A Place is already in play');
	gs = await getGameState(page);
	expect(gs.activePlace).toBe('place_drain_zone');
	expect(gs.players.player_1.hand.some(c => c.cardId === 'place_momentum_stabilizer')).toBe(true);

	// A destroyer Piecie removes it to its owner's discard.
	await page.evaluate(() => window.__testHooks.setPiecieOnField('player_1', 0, 'piecie_bong_hit_demolition', { faceDown: true }));
	await unlockPiecies(page, 'player_1');
	await activatePiecieOnField(page, 'piecie_bong_hit_demolition');
	gs = await getGameState(page);
	expect(gs.activePlace).toBeNull();
	await expect(page.locator('#board-place')).toContainText('No Place in play');
	await expect(page.locator('#board-place [data-card-id="place_drain_zone"]')).toHaveCount(0);
	await expect(page.locator('body')).not.toHaveClass(/place-active/);
	expect(gs.players.player_1.graveyard.some(c => c.cardId === 'place_drain_zone' && c.type === 'PLACE')).toBe(true);
	expect(gs.players.player_2.graveyard.some(c => c.cardId === 'place_drain_zone')).toBe(false);
	expect(await power('player_1'), 'Place gone: own Power back to 20').toBe(20);
	expect(await power('player_2'), 'Place gone: opponent Power back to 10').toBe(10);
});
