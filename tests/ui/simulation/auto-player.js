/**
 * auto-player.js — Automated human player for simulation runs.
 *
 * On each turn the auto-player:
 *   1. Plays one Snelle Piecie from hand if available (they're instant, no face-down)
 *   2. Attempts General Quest if the button is enabled
 *   3. Plays one regular Piecie from hand (goes face-down)
 *   4. Ends the turn
 *
 * Returns 'gameover' if the reward overlay appeared, 'turn' if control returned normally.
 */

import { readHand } from '../helpers.js';

/**
 * Dismiss any modal that appeared (target selectors, confirms, dice, etc.)
 * Skips disabled buttons — e.g. #modal-attempt is disabled when quest is impossible.
 * If the only visible modal button is disabled (impossible quest), exits the modal via cancel.
 */
async function autoDismissAll(page, maxRounds = 4) {
	for (let i = 0; i < maxRounds; i++) {
		// Prefer enabled buttons
		const enabledSelectors = [
			'.target-option',
			'.modal-mosje-select-btn:not(:disabled)',
			'#modal-yes',
			'#modal-attempt:not(:disabled)',
			'#modal-roll',
			'#modal-done',
			'#modal-continue',
		];
		let clicked = false;
		for (const sel of enabledSelectors) {
			const el = page.locator(sel).first();
			if (await el.isVisible({ timeout: 300 }).catch(() => false)) {
				// Double-check not disabled before clicking
				const disabled = await el.evaluate(e => e.disabled === true).catch(() => false);
				if (!disabled) {
					await el.click();
					await page.waitForTimeout(300);
					clicked = true;
					break;
				}
			}
		}
		if (!clicked) {
			// Check if a modal is still open — if yes, try clicking the backdrop or a cancel button
			const modalOpen = await page.locator('.modal-root--open').isVisible({ timeout: 200 }).catch(() => false);
			if (modalOpen) {
				// Quest impossible (#modal-attempt disabled) — click backdrop to close
				const backdrop = page.locator('.modal-backdrop').first();
				if (await backdrop.isVisible({ timeout: 200 }).catch(() => false)) {
					await backdrop.click({ force: true });
					await page.waitForTimeout(400);
					continue;
				}
			}
			break;
		}
		await page.waitForTimeout(200);
	}
}

/**
 * Play one automated human turn.
 * Returns 'gameover' | 'turn' | 'timeout'.
 */
export async function playAutoTurn(page) {
	// Skip if game is already over
	if (await page.locator('#reward-overlay').isVisible({ timeout: 100 }).catch(() => false)) {
		return 'gameover';
	}

	// 1. Play a snelle piecie if available (instant — no face-down needed)
	const hand = await readHand(page);
	const snelle = hand.find(c => c.cardType === 'SNELLE_PIECIE');
	if (snelle) {
		const wrap = page.locator(`.hand-card-wrap[data-card-id="${snelle.cardId}"]`).first();
		const btn = wrap.locator('.hand-card__play-btn');
		if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
			await btn.click();
			await page.waitForTimeout(400);
			await autoDismissAll(page);
		}
	}

	if (await page.locator('#reward-overlay').isVisible({ timeout: 100 }).catch(() => false)) return 'gameover';

	// 2. Attempt general quest if available
	const questBtn = page.locator('#btn-general-quest');
	const questEnabled = await questBtn.evaluate(el => !el.disabled).catch(() => false);
	if (questEnabled) {
		await questBtn.click();
		await page.waitForTimeout(400);
		await autoDismissAll(page, 8);  // more rounds for multi-step quest flow
	}

	if (await page.locator('#reward-overlay').isVisible({ timeout: 100 }).catch(() => false)) return 'gameover';

	// 3. Play one piecie (goes face-down)
	const hand2 = await readHand(page);
	const piecie = hand2.find(c => c.cardType === 'PIECIE');
	if (piecie) {
		const wrap = page.locator(`.hand-card-wrap[data-card-id="${piecie.cardId}"]`).first();
		const btn = wrap.locator('.hand-card__play-btn');
		if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
			await btn.click();
			await page.waitForTimeout(400);
			await autoDismissAll(page);
		}
	}

	if (await page.locator('#reward-overlay').isVisible({ timeout: 100 }).catch(() => false)) return 'gameover';

	// 4. End turn
	await page.click('#btn-end-turn');
	return await Promise.race([
		page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 45000 }).then(() => 'turn'),
		page.waitForSelector('#reward-overlay', { timeout: 45000 }).then(() => 'gameover'),
	]).catch(() => 'timeout');
}
