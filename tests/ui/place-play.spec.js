/**
 * place-play.spec.js - U7: a Place is played from hand and works at once, only one Place at a time,
 * a destroyer Piecie removes it to its owner's discard (Phase 57, TABLE-05).
 * KNOWN GAP (fix in Phase 60): Drain Zone's text says "+10 Power" but the engine only adds +10 to DRAIN losses
 * (src/engine/mp/lossSteps/drainZoneBonus.js), so no on-screen Power change is asserted here.
 */
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setEnergy, setHand, playCardFromHand,
	unlockPiecies, clearEntryProtection,
} from './helpers.js';
import { activatePiecieOnField } from '../helpers/piecieUi.js';

test('Place played from hand sits on the board, pays Energy, blocks a second Place, and a destroyer sends it to the owner discard', async ({ page }) => {
	test.setTimeout(90000);
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await clearEntryProtection(page);
	await setHand(page, 'player_1', ['place_drain_zone', 'place_momentum_stabilizer']);
	await setEnergy(page, 'player_1', 6);

	await playCardFromHand(page, 'place_drain_zone');
	await expect.poll(async () => (await getGameState(page)).activePlace).toBe('place_drain_zone');
	let gs = await getGameState(page);
	expect(gs.players.player_1.energy, 'Drain Zone costs 3').toBe(3);
	expect(gs.activePlacePlayedBy).toBe('player_1');
	await expect(page.locator('#piecies-player [data-card-id="place_drain_zone"]')).toBeVisible();

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
	expect(gs.players.player_1.graveyard.some(c => c.cardId === 'place_drain_zone' && c.type === 'PLACE')).toBe(true);
	expect(gs.players.player_2.graveyard.some(c => c.cardId === 'place_drain_zone')).toBe(false);
});
