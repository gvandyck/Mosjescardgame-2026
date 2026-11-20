// ability-banner.spec.js — 72-10 (D-11): the activation banner shows a real ability name, never a clause, and the log says "uses".
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, setEnergy } from './helpers.js';
import { abilityByTap } from '../helpers/boardTaps.js';

const SHOT = '.planning/phases/72-screens-for-the-new-design/shots/72-10-ability-banner.png';

async function boot(page) {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await page.evaluate(() => window.__testHooks.clearEntryProtection?.());
}

// Record every cast chip text (the chip is removed when its animation ends), use the ability, answer its pick pause with the first option.
async function useAbility(page, id, energy, { shot = false } = {}) {
	await page.evaluate(() => {
		window.__chips = [];
		new MutationObserver((muts) => muts.forEach(m => m.addedNodes.forEach(n => {
			if (n.classList?.contains('cast-chip')) window.__chips.push(n.textContent);
		}))).observe(document.body, { childList: true });
	});
	await setMosjeOnField(page, 'player_1', 0, id, { mp: 40, level: 1 });
	await setEnergy(page, 'player_1', energy);
	await abilityByTap(page, id);
	const pick = page.locator('.modal-mosje-select-btn').first();
	if (await pick.isVisible().catch(() => false)) await pick.click();
	await expect.poll(() => page.evaluate(() => window.__chips.length), { timeout: 8000 }).toBeGreaterThan(0);
	if (shot) await page.screenshot({ path: SHOT });
	return page.evaluate(() => window.__chips);
}

test.describe('Ability banner and log (72-10)', () => {
	test('Gandoe, The Cloude Wizard: banner "Top 3", log "uses Top 3"', async ({ page }) => {
		await boot(page);
		const chips = await useAbility(page, 'mosje_gandoe_wizard', 3, { shot: true });
		for (const t of chips) {
			expect(t).toBe('Top 3');
			expect(t).not.toMatch(/^Once per turn/);
		}
		await expect(page.locator('.log-row', { hasText: 'Gandoe, The Cloude Wizard uses Top 3' }).first()).toBeAttached({ timeout: 8000 });
	});

	test('Ming, The Natural: banner "Lucky Draw", log "uses Lucky Draw"', async ({ page }) => {
		await boot(page);
		const chips = await useAbility(page, 'mosje_ming_natural', 3);
		for (const t of chips) expect(t).toBe('Lucky Draw');
		await expect(page.locator('.log-row', { hasText: 'Ming, The Natural uses Lucky Draw' }).first()).toBeAttached({ timeout: 8000 });
	});
});
