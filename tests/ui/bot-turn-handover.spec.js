/**
 * bot-turn-handover.spec.js - the human gets End Turn back only when their turn has really started.
 *
 * The bug (found 2026-11-24 in full-game.spec.js): the bot's last step ("ends turn") made the human the active player and
 * enabled End Turn, but the human's turn start (startTurn, "Now active: <you>") ran only after the spotlight hold, 60 ms to
 * 1.5 s later. A click on End Turn in that gap ended a turn that had not started, and the late turn start then ran on the
 * bot's state and started a second bot turn beside the first (the board jumped back to "Bot" and two bots played at once).
 */
import { test, expect } from '@playwright/test';
import { seedOfflineSession, waitForBoard, GAME_URL_TEST } from './helpers.js';
import { clickEndTurn } from '../helpers/clickEndTurn.js';

// The page notes, at the moment End Turn becomes enabled for the human, the newest "Now active" line of the battle log.
async function watchHandover(page) {
	await page.addInitScript(() => {
		window.__handovers = [];
		let wasEnabled = false;
		const check = () => {
			const btn = document.getElementById('btn-end-turn');
			const gs = window.__testHooks?.getGameState?.();
			const enabled = !!btn && btn.disabled === false && gs?.activePlayerId === 'player_1' && gs?.status !== 'FINISHED';
			if (enabled && !wasEnabled) {
				const rows = [...document.querySelectorAll('#log-root .log-row')].map(el => el.textContent.trim());
				window.__handovers.push({ turn: gs.turnNumber, newestNowActive: rows.find(r => r.startsWith('Now active:')) ?? null, human: gs.players.player_1.name });
			}
			wasEnabled = enabled;
		};
		new MutationObserver(check).observe(document, { subtree: true, attributes: true, attributeFilter: ['disabled'], childList: true });
	});
}

async function answerPrompts(page) {
	for (const sel of ['.modal-card--reaction .modal-mosje-select-btn[data-id="__pass__"]', '.modal-mosje-select-btn[data-id="draw"]']) {
		const btn = page.locator(sel).first();
		if (await btn.isVisible().catch(() => false)) await btn.click({ timeout: 2000 }).catch(() => {});
	}
}

test('End Turn comes back to the human only after their turn has started (three bot turns)', async ({ page }) => {
	test.setTimeout(120000);
	await watchHandover(page);
	await seedOfflineSession(page, 'STARTER_DIGITAL', 'STARTER_PHYSICAL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	for (let n = 1; n <= 3; n++) {
		await answerPrompts(page);
		await clickEndTurn(page);
		// The bot plays; wait for the handover of this round (the first entry is the game start itself).
		await expect.poll(async () => { await answerPrompts(page); return page.evaluate(() => window.__handovers.length); },
			{ timeout: 30000, intervals: [200], message: `handover after bot turn ${n}` }).toBeGreaterThan(n);
	}

	const handovers = (await page.evaluate(() => window.__handovers)).slice(1);
	for (const h of handovers) {
		expect(h.newestNowActive, `End Turn was enabled in turn ${h.turn} before the human's turn started`).toContain(`Now active: ${h.human}.`);
	}

	// And no second bot turn ran beside the first: no "Now active: Bot. Turn N." twice for one N.
	const starts = await page.evaluate(() => [...document.querySelectorAll('#log-root .log-row')].map(el => el.textContent.trim()).filter(r => r.startsWith('Now active:')));
	expect(new Set(starts).size, `each turn starts once: ${starts.join(' | ')}`).toBe(starts.length);
});
