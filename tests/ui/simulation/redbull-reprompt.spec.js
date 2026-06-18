/**
 * redbull-reprompt.spec.js — Redbull re-fires input abilities with a FRESH prompt.
 *
 * Group A: Calculated Guess / Tactical Analysis / Perfect Placement record a
 * guess/selection in _pendingTargets that goes stale on a headless re-run, so the
 * engine signals _redbullAwaitingReprompt and main.js re-runs the activation flow
 * once with new input. This verifies Martin Senor West (Calculated Guess) prompts
 * TWICE under Redbull and the flag is consumed afterwards.
 *
 * Run: npx playwright test tests/ui/simulation/redbull-reprompt.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, unlockPiecies, playCardFromHand,
	getGameState, readLog,
} from '../helpers.js';

// Answer one round of the Calculated Guess flow: pick a card type, dismiss reveal.
// Generous waits — round 2's modal opens after an async board re-render, so it can
// take a beat to appear under load.
async function answerGuessRound(page, type = 'PIECIE') {
	const typeBtn = page.locator(`.modal-mosje-select-btn[data-id="${type}"]`);
	await typeBtn.first().waitFor({ state: 'visible', timeout: 15000 });
	await typeBtn.first().click();
	const cont = page.locator('#modal-continue');
	await cont.waitFor({ state: 'visible', timeout: 15000 });
	await cont.click();
	await page.waitForTimeout(300);
}

test('Redbull re-prompts Martin Senor West (Calculated Guess) — TWO guess rounds', async ({ page }) => {
	test.setTimeout(90000);

	await seedCustomDeck(page, {
		id: 'custom_rb_west', name: 'Redbull + Senor West',
		mosjes: ['mosje_martin_senor_west'],   // Calculated Guess: guess top-deck card type
		// Big deck so two guess rounds (each correct guess draws 2) never deplete it —
		// otherwise round 2 hits "deck empty" depending on the random shuffle.
		piecies: ['piecie_redbull', 'piecie_redbull',
		          ...Array(24).fill('piecie_kannetje_melk')],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);

	// Arm Redbull
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
	await page.locator('#piecies-player [data-card-id="piecie_redbull"]').first()
		.locator('button:has-text("Activate")').click();
	await page.waitForTimeout(500);
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBe(true);

	// Keep West comfortably above 0 so neither cast is blocked.
	await setMosjeMP(page, 'player_1', 0, 40);
	await page.waitForTimeout(200);

	// Fire the ability — expect TWO guess rounds (Redbull re-prompt).
	await page.locator('.mosje-card--owned[data-card-id="mosje_martin_senor_west"] .mosje-ability-btn').click();
	await answerGuessRound(page, 'PIECIE');   // round 1
	await answerGuessRound(page, 'MOSJE');    // round 2 (only appears if re-prompt fired)
	await page.waitForTimeout(400);
	await ss(page, 'redbull-reprompt-west');

	const log = (await readLog(page)).join(' | ');
	const guessLines = (log.match(/Calculated Guess/g) || []).length;
	console.log(`Calculated Guess log lines: ${guessLines}`);

	// Ability resolved twice, and Redbull was consumed.
	expect(guessLines).toBeGreaterThanOrEqual(2);
	expect(log).toContain('triggers TWICE');
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBeFalsy();
});

// Play + activate Redbull → abilityDoubleTrigger = true.
async function armRedbull(page) {
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
	await page.locator('#piecies-player [data-card-id="piecie_redbull"]').first()
		.locator('button:has-text("Activate")').click();
	await page.waitForTimeout(500);
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBe(true);
}

// One round of FPS West Tactical Analysis: pick opp card, guess a type, dismiss reveal.
async function answerTacticalRound(page, type = 'PIECIE') {
	const card = page.locator('.modal-mosje-select-btn[data-id="0"]');   // "Card 1"
	await card.first().waitFor({ state: 'visible', timeout: 15000 });
	await card.first().click();
	const typeBtn = page.locator(`.modal-mosje-select-btn[data-id="${type}"]`);
	await typeBtn.first().waitFor({ state: 'visible', timeout: 15000 });
	await typeBtn.first().click();
	const cont = page.locator('#modal-continue');
	await cont.waitFor({ state: 'visible', timeout: 15000 });
	await cont.click();
	await page.waitForTimeout(300);
}

test('Redbull re-prompts FPS West (Tactical Analysis) — TWO guess rounds', async ({ page }) => {
	test.setTimeout(90000);

	await seedCustomDeck(page, {
		id: 'custom_rb_fpswest', name: 'Redbull + FPS West',
		mosjes: ['mosje_fps_west'],   // Tactical Analysis: guess a type in opponent's hand
		piecies: ['piecie_redbull', 'piecie_redbull', ...Array(24).fill('piecie_kannetje_melk')],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'ARTISTIC_RHYTHM');   // opponent deck → opponent has a non-empty hand to analyze
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);
	await armRedbull(page);

	// Comfortable MP so a wrong guess (-20) never defeats FPS West across two rounds.
	await setMosjeMP(page, 'player_1', 0, 60);
	await page.waitForTimeout(200);

	await page.locator('.mosje-card--owned[data-card-id="mosje_fps_west"] .mosje-ability-btn').click();
	await answerTacticalRound(page, 'PIECIE');   // round 1
	await answerTacticalRound(page, 'MOSJE');    // round 2 (only appears if re-prompt fired)
	await page.waitForTimeout(400);
	await ss(page, 'redbull-reprompt-fpswest');

	const log = (await readLog(page)).join(' | ');
	const lines = (log.match(/Tactical Analysis/g) || []).length;
	console.log(`Tactical Analysis log lines: ${lines}`);

	expect(lines).toBeGreaterThanOrEqual(2);
	expect(log).toContain('triggers TWICE');
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBeFalsy();
});

// One round of Tuk Architect Perfect Placement. Anchored on the modal heading so it
// works whether top5 yields one pick (duplicate cardIds) or two (distinct). The "1st
// card" heading is the per-round boundary, distinguishing round 2's first pick from
// round 1's optional second pick.
async function answerPlacementRound(page) {
	await page.locator('.modal-card h3:has-text("1st card")').waitFor({ state: 'visible', timeout: 15000 });
	await page.locator('.modal-card-option').first().click();
	const second = page.locator('.modal-card h3:has-text("2nd card")');
	if (await second.isVisible({ timeout: 3000 }).catch(() => false)) {
		await page.locator('.modal-card-option').first().click();
	}
	await page.waitForTimeout(400);
}

test('Redbull re-prompts Tuk Architect (Perfect Placement) — TWO placement rounds', async ({ page }) => {
	test.setTimeout(90000);

	await seedCustomDeck(page, {
		id: 'custom_rb_tukarch', name: 'Redbull + Tuk Architect',
		mosjes: ['mosje_tuk_architect'],   // Perfect Placement: 15 MP, peek top 5, take 2
		piecies: ['piecie_redbull', 'piecie_redbull', ...Array(24).fill('piecie_kannetje_melk')],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);
	await armRedbull(page);

	// 50 MP so both 15-MP placements succeed.
	await setMosjeMP(page, 'player_1', 0, 50);
	await page.waitForTimeout(200);

	await page.locator('.mosje-card--owned[data-card-id="mosje_tuk_architect"] .mosje-ability-btn').click();
	await answerPlacementRound(page);   // round 1
	await answerPlacementRound(page);   // round 2 (only appears if re-prompt fired)
	await page.waitForTimeout(400);
	await ss(page, 'redbull-reprompt-tukarch');

	const log = (await readLog(page)).join(' | ');
	const lines = (log.match(/Perfect Placement/g) || []).length;
	console.log(`Perfect Placement log lines: ${lines}`);

	expect(lines).toBeGreaterThanOrEqual(2);
	expect(log).toContain('triggers TWICE');
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBeFalsy();
});
