/**
 * binti-creator.spec.js — Quick Sketch end-to-end: discard 2 FOOD Piecies, then
 * search the deck for a card and add it to hand. Verifies the real UI flow (two
 * FOOD-discard modals + a deck-search modal) wires into the engine ability.
 *
 * Run: npx playwright test tests/ui/simulation/binti-creator.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss, setHand, getGameState,
} from '../helpers.js';

async function pickFirstCardOption(page, headingText) {
	await page.locator(`.modal-card h3:has-text("${headingText}")`).waitFor({ state: 'visible', timeout: 15000 });
	await page.locator('.modal-card-option').first().click();
	await page.waitForTimeout(300);
}

test('Binti Creator Quick Sketch — discard 2 FOOD, tutor 1 card to hand', async ({ page }) => {
	test.setTimeout(90000);

	await seedCustomDeck(page, {
		id: 'custom_binti_creator', name: 'Binti Creator',
		mosjes: ['mosje_binti_creator'],
		piecies: [...Array(20).fill('piecie_kannetje_melk')],  // deck content to tutor from
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Hand: 2 FOOD Piecies (the discard cost) + a non-FOOD filler.
	await setHand(page, 'player_1', ['piecie_varkenspootjes', 'piecie_varkenspootjes', 'snelle_jensen']);
	await page.waitForTimeout(200);

	const before = await getGameState(page);
	const gravBefore = before.players.player_1.graveyard.length;
	const handBefore = before.players.player_1.hand.length;
	const deckBefore = before.players.player_1.deck.length;

	await page.locator('.mosje-card--owned[data-card-id="mosje_binti_creator"] .mosje-ability-btn').click();
	await pickFirstCardOption(page, '1st FOOD');        // discard #1
	await pickFirstCardOption(page, '2nd FOOD');        // discard #2
	await pickFirstCardOption(page, 'search your deck'); // tutor target
	await page.waitForTimeout(500);
	await ss(page, 'binti-creator-quicksketch');

	const after = await getGameState(page);
	const handIds = after.players.player_1.hand.map(c => c.cardId ?? c);
	console.log('hand after:', handIds.join(','), '| graveyard:', after.players.player_1.graveyard.length);

	expect(after.players.player_1.graveyard.length).toBe(gravBefore + 2);   // 2 FOOD discarded
	expect(handIds).not.toContain('piecie_varkenspootjes');                 // both discarded
	expect(after.players.player_1.hand.length).toBe(handBefore - 1);        // −2 discarded, +1 tutored
	expect(after.players.player_1.deck.length).toBe(deckBefore - 1);        // tutored card pulled from deck
});
