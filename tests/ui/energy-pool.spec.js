/**
 * energy-pool.spec.js - U1: the Energy crystals, the spend preview and the piles on the 2.0 board (UI-02, Phase 63-02).
 * 6 gems per player fill with the Energy pool, fill each turn, fade out on payment, cap at 6 (never a 7th gem), a hovered
 * hand card dims the gems it would spend ("6/6 -> 3/6"), and the Welloe pile exists only while it has cards (D-12, D-13).
 * Judged at 1920x1080.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, setEnergy, setHand, setMosjeOnField, playCardFromHand, getGameState } from './helpers.js';
import { answerModals } from '../helpers/answerModals.js';

const SHOT_DIR = 'tests/ui/screenshots/board-2-0';
const MINE = '#energy-player .energy-crystals';

async function loadBoard(page) {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await answerModals(page, [], { max: 4, wait: 500 }); // a random starter (Coert) can open a blocking "Draw step" modal
	await expect(page.locator('.modal-card')).toHaveCount(0);
	await page.mouse.move(2, 2);
}

/** Remember whether the crystal animation attributes ever appeared (the board re-renders and drops them quickly). */
function watchCrystalAnimations(page) {
	return page.evaluate(() => {
		window.__crystalSeen = { gain: 0, spend: 0 };
		new MutationObserver(() => {
			for (const kind of ['gain', 'spend']) {
				if (document.querySelector(`#energy-player [data-crystal-anim="${kind}"]`)) window.__crystalSeen[kind]++;
			}
		}).observe(document.getElementById('board-root'), { childList: true, subtree: true, attributes: true });
	});
}

const seenAnimations = (page) => page.evaluate(() => window.__crystalSeen);
const energyOf = (page, playerId) => page.evaluate((pid) => window.__testHooks.getEnergy(pid), playerId);
const runBoundary = (page, kind, playerId) => page.evaluate(({ k, p }) => window.__testHooks.runTurnBoundary(k, p), { k: kind, p: playerId });

test('U1: each player shows 6 gems, filled as many as the Energy pool, with a "n/6" count', async ({ page }) => {
	await loadBoard(page);
	for (const [side, playerId] of [['player', 'player_1'], ['opponent', 'player_2']]) {
		const energy = await energyOf(page, playerId);
		const root = page.locator(`#energy-${side} .energy-crystals`);
		await expect(root).toHaveAttribute('data-energy', String(energy));
		await expect(root).toHaveAttribute('data-energy-max', '6');
		await expect(page.locator(`#energy-${side} .energy-gem`)).toHaveCount(6);
		await expect(page.locator(`#energy-${side} .energy-gem[data-crystal="full"]`)).toHaveCount(energy);
		await expect(page.locator(`#energy-${side} .energy-count`)).toHaveText(`${energy}/6`);
		await expect(page.locator(`#energy-${side}`)).toHaveAttribute('data-energy', String(energy)); // the mount mirrors it
	}

	// The gems are a column at the left end of the row, left of the first slot.
	const box = async (selector) => page.locator(selector).first().boundingBox();
	const column = await box('#energy-player .energy-crystals');
	const firstSlot = await box('#zone-player > *');
	expect(column.x + column.width).toBeLessThanOrEqual(firstSlot.x + 1);
	const gems = await page.locator('#energy-player .energy-gem').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().y));
	expect(new Set(gems.map((y) => Math.round(y))).size, 'gems stack vertically').toBe(6);
});

test('U1: the Energy fills at the start of each turn and never grows a 7th gem', async ({ page }) => {
	await loadBoard(page);
	await watchCrystalAnimations(page);

	await setEnergy(page, 'player_1', 2);
	await runBoundary(page, 'start', 'player_1');
	await answerModals(page, [], { max: 4, wait: 500 });
	await expect(page.locator(MINE)).toHaveAttribute('data-energy', '3');
	await expect(page.locator('#energy-player .energy-gem[data-crystal="full"]')).toHaveCount(3);
	await expect(page.locator('#energy-player .energy-count')).toHaveText('3/6');
	expect((await seenAnimations(page)).gain, 'the new gem plays the gain animation').toBeGreaterThan(0);

	await setEnergy(page, 'player_1', 6);
	await runBoundary(page, 'start', 'player_1');
	await answerModals(page, [], { max: 4, wait: 500 });
	await expect(page.locator(MINE)).toHaveAttribute('data-energy', '6');
	await expect(page.locator('#energy-player .energy-gem')).toHaveCount(6);
	await expect(page.locator('#energy-player .energy-gem[data-crystal="full"]')).toHaveCount(6);
	await expect(page.locator('#energy-player .energy-count')).toHaveText('6/6');
	expect(await energyOf(page, 'player_1')).toBe(6);
});

test('U1: paying for a card drops the gems', async ({ page }) => {
	await loadBoard(page);
	await setEnergy(page, 'player_1', 4);
	await setMosjeOnField(page, 'player_1', 1, null); // an empty Mosje slot to summon into
	await setHand(page, 'player_1', ['mosje_alyssa_fissa']); // cost 2
	await watchCrystalAnimations(page);

	await playCardFromHand(page, 'mosje_alyssa_fissa');
	await answerModals(page, [], { max: 3, wait: 500 });

	await expect(page.locator(MINE)).toHaveAttribute('data-energy', '2');
	await expect(page.locator('#energy-player .energy-gem[data-crystal="full"]')).toHaveCount(2);
	expect((await getGameState(page)).players.player_1.energy).toBe(2);
	expect((await seenAnimations(page)).spend, 'the spent gems fade out').toBeGreaterThan(0);
});

test('U1: hovering a hand card dims the gems it would spend, leaving clears it', async ({ page }) => {
	await loadBoard(page);
	await setEnergy(page, 'player_1', 6);
	await setHand(page, 'player_1', ['place_the_gym']); // a cost-3 Place

	await page.locator('.hand-card-wrap[data-card-id="place_the_gym"]').hover({ position: { x: 100, y: 30 } });
	await expect(page.locator('#energy-player .energy-gem[data-crystal="spend"]')).toHaveCount(3);
	await expect(page.locator('#energy-player .energy-gem[data-crystal="full"]')).toHaveCount(3);
	await expect(page.locator('#energy-player .energy-count')).toContainText('→ 3/6');
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.waitForTimeout(400);
	await page.screenshot({ path: `${SHOT_DIR}/u1-energy.png` });

	await page.mouse.move(960, 420);
	await expect(page.locator('#energy-player .energy-gem[data-crystal="spend"]')).toHaveCount(0);
	await expect(page.locator('#energy-player .energy-gem[data-crystal="full"]')).toHaveCount(6);
	await expect(page.locator('#energy-player .energy-count')).toHaveText('6/6');

	// A cost the pool cannot cover marks no gem and says what is missing.
	await setEnergy(page, 'player_1', 2);
	await page.locator('.hand-card-wrap[data-card-id="place_the_gym"]').hover({ position: { x: 100, y: 30 } });
	await expect(page.locator('#energy-player .energy-gem[data-crystal="spend"]')).toHaveCount(0);
	await expect(page.locator('#energy-player .energy-count')).toContainText('need 3');
});

test('U1: the piles carry their hooks and the Welloe pile exists only while it has cards', async ({ page }) => {
	await loadBoard(page);

	// Deck and discard always; mine shows its count, the opponent deck count stays hidden.
	await expect(page.locator('[data-zone="player"] [data-pile="deck"]')).toHaveAttribute('data-count', /^\d+$/);
	await expect(page.locator('[data-zone="player"] [data-pile="discard"]')).toHaveAttribute('data-count', '0');
	await expect(page.locator('[data-zone="opponent"] [data-pile="deck"]')).not.toHaveAttribute('data-count', /.*/);
	await expect(page.locator('[data-zone="opponent"] [data-pile="discard"]')).toHaveAttribute('data-count', '0');
	await expect(page.locator('[data-pile="welloe"]')).toHaveCount(0);

	await page.evaluate(() => {
		window.__testHooks.injectWelloeMosje('player_1', 'mosje_binti');
		window.__testHooks.rerender();
	});
	const pile = page.locator('#welloe-player [data-pile="welloe"][data-count="1"]');
	await expect(pile).toBeVisible();
	await expect(pile).toContainText('WELLOE');
	await expect(page.locator('#welloe-opponent [data-pile="welloe"]')).toHaveCount(0);
	const rect = await pile.boundingBox();
	expect(rect.width).toBeGreaterThanOrEqual(44);
	expect(rect.height).toBeGreaterThanOrEqual(44);

	// A tap opens the list; its card rows open the preview and closing the preview returns to the list.
	await pile.click();
	const list = page.locator('.modal-card', { hasText: 'Welloe pile' });
	await expect(list).toBeVisible();
	await list.locator('.graveyard-card-option').click();
	await expect(page.locator('.card-detail')).toBeVisible();
	await page.click('#modal-close-preview');
	await expect(page.locator('.modal-card', { hasText: 'Welloe pile' })).toBeVisible();
	await page.click('#modal-close-graveyard');
	await expect(page.locator('.modal-card')).toHaveCount(0);

	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/u1-welloe-pile.png` });
});
