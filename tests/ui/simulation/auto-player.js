/**
 * auto-player.js — Automated human player for simulation runs.
 *
 * On each turn the auto-player:
 *   1. Plays one Snelle Piecie from hand if available (they're instant, no face-down)
 *   2. Attempts a Quest if a Mosje's Quest chip is enabled (tap flow, 63-06)
 *   3. Plays one regular Piecie from hand (goes face-down)
 *   4. Ends the turn
 *
 * Returns 'gameover' if the reward overlay appeared, 'turn' if control returned normally.
 */

import { readHand, questFirstAvailable } from '../helpers.js';

/**
 * Returns true if a modal is currently open.
 */
async function isModalOpen(page) {
	return page.locator('.modal-root--open').isVisible({ timeout: 200 }).catch(() => false);
}

/**
 * Dismiss any modal that appeared (target selectors, confirms, dice, info modals, etc.)
 *
 * Strategy per round:
 *   1. Click the highest-priority known progressing button (target → confirm → roll → done).
 *   2. If none of those, click ANY enabled button inside the open modal (catch-all for
 *      info modals "OK", card-choice modals, reveal modals, etc.).
 *   3. If still nothing actionable, force-click the backdrop to dismiss.
 * Loops until no modal remains open or maxRounds is hit.
 */
async function autoDismissAll(page, maxRounds = 10) {
	for (let i = 0; i < maxRounds; i++) {
		if (!(await isModalOpen(page))) return;  // no modal — done

		// Priority 1: known progressing buttons (enabled only)
		const prioritySelectors = [
			'.target-option',
			'.modal-mosje-select-btn:not(:disabled)',
			'#modal-yes',
			'#modal-attempt:not(:disabled)',
			'#modal-roll',
			'#modal-done',
			'#modal-continue',
		];
		let clicked = false;
		for (const sel of prioritySelectors) {
			const el = page.locator(sel).first();
			if (await el.isVisible({ timeout: 200 }).catch(() => false)) {
				const disabled = await el.evaluate(e => e.disabled === true).catch(() => false);
				if (!disabled) {
					await el.click().catch(() => {});
					await page.waitForTimeout(300);
					clicked = true;
					break;
				}
			}
		}

		// Priority 2: ANY enabled button inside the open modal (catch-all)
		if (!clicked) {
			const anyBtn = page.locator('.modal-root--open button:not([disabled])').first();
			if (await anyBtn.isVisible({ timeout: 200 }).catch(() => false)) {
				await anyBtn.click().catch(() => {});
				await page.waitForTimeout(300);
				clicked = true;
			}
		}

		// Priority 3: force-click the backdrop (last resort)
		if (!clicked) {
			const backdrop = page.locator('.modal-backdrop').first();
			if (await backdrop.isVisible({ timeout: 200 }).catch(() => false)) {
				await backdrop.click({ force: true }).catch(() => {});
				await page.waitForTimeout(400);
				clicked = true;
			}
		}

		if (!clicked) return;  // nothing left to click
		await page.waitForTimeout(150);
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

	// 2. Quest with the first Mosje that can act (2.0 tap flow: tap the Mosje, Quest, the first valid Quest tile, click through).
	// questFirstAvailable returns false (and taps nothing further) when no Mosje's Quest chip is enabled.
	if (await questFirstAvailable(page)) {
		await autoDismissAll(page);
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

	// 4. End turn — but FIRST make sure no modal backdrop is intercepting clicks.
	// A lingering modal (info popup, card choice, reveal) blocks the End Turn button.
	await autoDismissAll(page);
	if (await isModalOpen(page)) {
		// Still stuck — try one more aggressive dismissal pass
		await autoDismissAll(page, 15);
	}
	if (await page.locator('#reward-overlay').isVisible({ timeout: 100 }).catch(() => false)) return 'gameover';

	await page.click('#btn-end-turn').catch(() => {});
	return await Promise.race([
		page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 45000 }).then(() => 'turn'),
		page.waitForSelector('#reward-overlay', { timeout: 45000 }).then(() => 'gameover'),
	]).catch(() => 'timeout');
}
