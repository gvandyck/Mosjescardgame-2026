// phoneRaise.js - Phase 65-06: the board and the taps shared by the phone tap-raise specs. seedRaiseBoard sets the stage of
// slot-tiles.spec.js on a phone (Mosje slot 0 free, Piecie slots 1 and 2 free, 6 Energy, a hand of 5), openDrawer and raiseCard
// drive the bottom bar and the drawer by real taps. Only testMode hooks set the stage (no new hook).
import { expect } from '@playwright/test';
import { setMosjeOnField } from '../ui/helpers.js';
import { seedPhoneBoard } from './phoneBoard.js';
import { rectOf } from './phoneGeometry.js';

export const FISSA = 'mosje_alyssa_fissa';
export const KANNETJE = 'piecie_kannetje_melk';
export const DONER = 'piecie_broodje_doner';
export const JENSEN = 'snelle_jensen';
export const RAISE_HAND = [FISSA, KANNETJE, DONER, KANNETJE, JENSEN];

export const wrapOf = (page, cardId) => page.locator(`.hand-card-wrap[data-card-id="${cardId}"]`).first();
export const hintOf = (page) => page.locator('#board-root [data-place-here]');

/** The slot-tiles.spec.js board on a phone: my Mosje slot 0 and Piecie slots 1 + 2 are free, the rest of the table is full. */
export async function seedRaiseBoard(page, { energy = 6 } = {}) {
	await seedPhoneBoard(page, { hand: RAISE_HAND, energy });
	await setMosjeOnField(page, 'player_1', 0, null);
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_bulldozer', { mp: 50, level: 1 });
	await page.evaluate(() => {
		window.__testHooks.setPiecieOnField('player_1', 1, null);
		window.__testHooks.setPiecieOnField('player_1', 2, null);
	});
	await page.waitForTimeout(500);
}

/** Tap the Hand button and wait until the drawer has finished sliding up onto the bar. */
export async function openDrawer(page) {
	await page.locator('#phone-hand-toggle').tap();
	await expect(page.locator('.game-hand-panel')).toHaveAttribute('data-drawer', 'open');
	await expect.poll(async () => {
		const [panel, bar] = [await rectOf(page, '.game-hand-panel'), await rectOf(page, '#phone-bar')];
		return Math.abs(panel.bottom - bar.y);
	}, { message: 'the open drawer ends on the bar', timeout: 4000 }).toBeLessThanOrEqual(1);
}

/** Open the drawer and tap one hand card: the first tap must raise it (the bar switches to the raise dock). */
export async function raiseCard(page, cardId) {
	await openDrawer(page);
	await wrapOf(page, cardId).tap();
	await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'raise');
}
