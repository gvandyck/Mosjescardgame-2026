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
 * Walk the general-quest modal sequence explicitly:
 *   confirm pay (#modal-yes) → attempt (#modal-attempt) → roll (#modal-roll)
 *   → wait for dice animation → continue (#modal-done).
 * Some quests need a target/type pick first (Geen Raad) — handled by autoDismissAll
 * for those branches. Returns when the quest resolves or the flow can't proceed.
 */
async function runQuestFlow(page) {
	// Stage 1: confirm payment
	const yes = page.locator('#modal-yes');
	if (await yes.isVisible({ timeout: 2000 }).catch(() => false)) {
		await yes.click().catch(() => {});
		await page.waitForTimeout(300);
	}
	// Some quests (Geen Raad) pop an opponent-hand picker / type picker instead of attempt.
	// Resolve any such selector before the attempt button.
	const earlyPick = page.locator('.modal-mosje-select-btn:not(:disabled), .target-option').first();
	if (await earlyPick.isVisible({ timeout: 500 }).catch(() => false)) {
		await earlyPick.click().catch(() => {});
		await page.waitForTimeout(300);
	}
	// Stage 2: attempt (skip if disabled = impossible quest → close via backdrop)
	const attempt = page.locator('#modal-attempt');
	if (await attempt.isVisible({ timeout: 2000 }).catch(() => false)) {
		const disabled = await attempt.evaluate(e => e.disabled === true).catch(() => false);
		if (disabled) {
			// Impossible quest — close the modal and bail
			await autoDismissAll(page);
			return;
		}
		await attempt.click().catch(() => {});
		await page.waitForTimeout(300);
	}
	// Stage 3: roll the dice
	const roll = page.locator('#modal-roll');
	if (await roll.isVisible({ timeout: 2000 }).catch(() => false)) {
		await roll.click().catch(() => {});
		await page.waitForTimeout(1800);  // let the dice animation finish
	}
	// Stage 4: continue past the result
	const done = page.locator('#modal-done');
	if (await done.isVisible({ timeout: 3000 }).catch(() => false)) {
		await done.click().catch(() => {});
		await page.waitForTimeout(400);
	}
	// Any trailing modal (recovery prompts, reveals) — clean up generically
	await autoDismissAll(page);
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

	// 2. Attempt general quest if available — use EXPLICIT staged flow so the dice
	//    animation isn't interrupted by the generic backdrop-dismiss fallback.
	const questBtn = page.locator('#btn-general-quest');
	const questEnabled = await questBtn.evaluate(el => !el.disabled).catch(() => false);
	if (questEnabled) {
		await questBtn.click();
		await page.waitForTimeout(400);
		await runQuestFlow(page);
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
