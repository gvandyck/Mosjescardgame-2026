/**
 * redbull-cinema.spec.js — "Cinema mode" demo of the Redbull double-trigger.
 *
 * A deliberately SLOW, narrated walkthrough so a human can watch the effect play
 * out: board → Redbull placed → Redbull activated ("ability triggers TWICE") →
 * Alyssa Fissa's ability fires → her MP jumps by 40 (two ×20 echoes) not 20.
 *
 * It still asserts the real outcome, so it doubles as a visual regression check.
 * Runs in the `visual` project (headed + slowMo). Watch it:
 *   npx playwright test --project=visual tests/ui/cinema/redbull-cinema.spec.js --headed
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, unlockPiecies, playCardFromHand,
	getGameState, getHandSize, readOwnedMosjes,
} from '../helpers.js';

async function alyssaMp(page) {
	return (await getGameState(page))?.players?.player_1?.activeSlots?.[0]?.mp ?? null;
}

test('🎬 Redbull cinema — ability triggers TWICE (free echo)', async ({ page }, testInfo) => {
	test.setTimeout(120000);

	// Pause between story beats when watching (headed project) so it plays like a clip;
	// 0 in headless runs so CI/quick checks stay fast. Override with CINEMA=<ms>.
	const BEAT = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 2200 : 0);
	const beat = (label) => { if (label) console.log(`🎬 ${label}`); return BEAT ? page.waitForTimeout(BEAT) : Promise.resolve(); };

	// ── Scene 1: set the stage ────────────────────────────────────────────────
	await seedCustomDeck(page, {
		id: 'custom_cinema_redbull', name: 'Redbull Cinema',  // id MUST start with custom_ (resolveCustomDeckDef)
		mosjes: ['mosje_alyssa_fissa'],          // ability: +5 MP per card in hand
		piecies: ['piecie_redbull', 'piecie_redbull', 'piecie_redbull',
		          'piecie_quest_prep', 'piecie_quest_prep', 'piecie_quest_prep',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await beat('Scene 1 — Alyssa Fissa is on the field (ability: +5 MP per card in hand)');

	// Alyssa starts at 0 MP; hand is Redbull + 4 cards.
	await setMosjeMP(page, 'player_1', 0, 0);
	await setHand(page, 'player_1', ['piecie_redbull',
		'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await ss(page, 'cinema-redbull-1-start');
	await beat('Alyssa at 0 MP, holding 5 cards (Redbull + 4)');

	// ── Scene 2: play & activate Redbull ──────────────────────────────────────
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(600);
	await beat('Scene 2 — Redbull placed on the field');

	await unlockPiecies(page, 'player_1');
	const el = page.locator('#piecies-player [data-card-id="piecie_redbull"]').first();
	await el.locator('button:has-text("Activate")').click();
	await page.waitForTimeout(600);
	const flag = (await getGameState(page))?.players?.player_1?.abilityDoubleTrigger;
	expect(flag).toBe(true);
	await ss(page, 'cinema-redbull-2-active');
	await beat('⚡ Redbull ACTIVE — the next Mosje ability will trigger TWICE');

	// ── Scene 3: fire Alyssa's ability — watch MP jump ────────────────────────
	const before = await alyssaMp(page);
	const hand = await getHandSize(page, 'player_1');     // 4 cards remain after Redbull
	console.log(`🎬 Scene 3 — Alyssa MP before: ${before}; hand ${hand} → single +${hand * 5}, doubled +${hand * 10}`);
	await beat('About to fire Alyssa Fissa\'s ability…');

	await page.locator('.mosje-card--owned[data-card-id="mosje_alyssa_fissa"] .mosje-ability-btn').click();
	await page.waitForTimeout(900);
	await ss(page, 'cinema-redbull-3-fired');

	const after = await alyssaMp(page);
	const gained = after - before;
	console.log(`🎬 RESULT — Alyssa MP ${before} → ${after} (gained ${gained}; +${hand * 5} echoed twice)`);
	await beat(`💥 Ability fired TWICE — Alyssa gained ${gained} MP (not ${hand * 5})`);

	// Real assertions (cinema is also a regression check)
	expect(gained).toBe(hand * 10);                       // fired twice
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBeFalsy(); // flag consumed
	await beat('Scene 4 — flag consumed; Redbull is spent. 🎬 fin');
});
