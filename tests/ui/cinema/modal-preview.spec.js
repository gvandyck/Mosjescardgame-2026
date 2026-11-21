/**
 * modal-preview.spec.js — screenshots the card detail modal for each type, for design iteration. Run headed to watch:
 *   npx playwright test --project=visual tests/ui/cinema/modal-preview.spec.js --headed
 *
 * How the detail opens in the 2.1 game (Card frame v1): a tap on a card in the hand PLAYS it (a card that cannot be played says
 * why in a "Cannot Play" dialog), except a Personal Quest, whose tap opens the detail with its Play action (72-04). Every other
 * card opens its detail from a pile list: a row of the discard pile opens the same card detail modal. So the Piecie,
 * Snelle and Place details are opened from the discard pile (the Mosje from the Welloe pile), the Personal Quest detail from the hand.
 */

import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, ss, setHand } from '../helpers.js';

const MOSJE = 'mosje_youri'; // a Mosje in a pile sits in the Welloe pile (its own list; the discard pile holds only the other cards)
const PILE_CARDS = [['piecie', 'piecie_redbull'], ['snelle', 'snelle_ff_haaltje_nemen'], ['place', 'place_the_gym']];

test('🪟 Card detail modal — each type', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const HOLD = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 3500 : 0);
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	const pqId = await page.evaluate(async () => (await import('/src/data/personalQuests.js')).PERSONAL_QUESTS[0].id);
	await page.evaluate((ids) => { for (const id of ids) window.__testHooks.injectGraveyardCard('player_1', id); window.__testHooks.rerender(); }, PILE_CARDS.map(([, id]) => id));
	await page.evaluate((id) => { window.__testHooks.injectWelloeMosje('player_1', id); window.__testHooks.rerender(); }, MOSJE);

	const closeDetail = async () => {
		if (HOLD) await page.waitForTimeout(HOLD); // linger so it's watchable headed
		await page.locator('#modal-close-preview').click({ force: true }).catch(() => {});
		await page.locator('.card-detail').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
		await page.waitForTimeout(200);
	};

	for (const [label, id] of [['mosje', MOSJE], ...PILE_CARDS]) {
		await page.locator(label === 'mosje' ? '#welloe-player [data-pile="welloe"]' : '[data-zone="player"] [data-pile="discard"]').click();
		await expect(page.locator('.modal-card', { hasText: 'pile' })).toBeVisible();
		await page.locator(`.graveyard-card-option[data-card-id="${id}"]`).click();
		await page.locator('.card-detail').waitFor({ state: 'visible', timeout: 5000 });
		await page.waitForTimeout(400);
		await ss(page, `modal-${label}`);
		console.log(`🪟 ${label} modal`);
		await closeDetail();
		await page.click('#modal-close-graveyard');
	}

	// Personal Quest: a tap in the hand opens its detail with the Play action.
	await setHand(page, 'player_1', [pqId]);
	await page.waitForTimeout(300);
	await page.locator(`.hand-card-wrap[data-card-id="${pqId}"]`).first().hover({ position: { x: 100, y: 30 } });
	await page.waitForTimeout(250);
	await page.locator(`.hand-card[data-card-id="${pqId}"]`).click({ position: { x: 30, y: 30 } });
	await page.locator('.card-detail').waitFor({ state: 'visible', timeout: 5000 });
	await page.waitForTimeout(400);
	await ss(page, 'modal-quest');
	console.log('🪟 quest modal');
	await closeDetail();
});
