/**
 * redbull-once-per-turn.spec.js — Redbull must NOT double once-per-turn abilities.
 *
 * Ruling (user, 2026-06-17): Redbull is a powerup "within bounds" — it respects
 * once-per-turn cooldowns and once-per-game caps. But the echo in useMosjeAbility
 * calls the ability fn directly, AFTER the engine sets abilityUsedThisTurn, so it
 * bypasses the per-turn brake and doubles abilities it shouldn't ("Group B leak").
 *
 * Tuk Healer (Healing Presence: all your Mosjes +15 MP, once per turn) is the
 * clean canary: single = +15, leaked double = +30.
 *
 * Run: npx playwright test tests/ui/simulation/redbull-once-per-turn.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, unlockPiecies, playCardFromHand,
	getGameState, readOwnedMosjes,
} from '../helpers.js';

async function armRedbull(page) {
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
	const el = page.locator('#piecies-player [data-card-id="piecie_redbull"]').first();
	await el.locator('button:has-text("Activate")').click();
	await page.waitForTimeout(500);
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBe(true);
}

test('Redbull does NOT double Tuk Healer (once-per-turn) — +15, not +30', async ({ page }) => {
	test.setTimeout(90000);

	await seedCustomDeck(page, {
		id: 'custom_rb_tuk_healer', name: 'Redbull + Tuk Healer',
		mosjes: ['mosje_tuk_healer'],   // Healing Presence: all your Mosjes +15 MP (once/turn)
		piecies: ['piecie_redbull', 'piecie_redbull',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);
	await armRedbull(page);

	// Start at a known MP so the gain is unambiguous and stays under the 100 cap.
	await setMosjeMP(page, 'player_1', 0, 0);
	await page.waitForTimeout(200);
	const before = (await readOwnedMosjes(page))[0]?.mp;

	await page.locator('.mosje-card--owned[data-card-id="mosje_tuk_healer"] .mosje-ability-btn').click();
	await page.waitForTimeout(800);
	await ss(page, 'redbull-tuk-healer');

	const after = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`Tuk Healer MP ${before}→${after} (gained ${after - before}; single should be 15)`);

	// Once-per-turn ability: Redbull must not echo it.
	expect(after - before).toBe(15);
});
