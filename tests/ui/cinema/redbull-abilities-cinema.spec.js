/**
 * redbull-abilities-cinema.spec.js — "Cinema mode" demos of the Redbull
 * ACTIVATION TRIGGER across different Mosje abilities.
 *
 * Deliberately SLOW, narrated walkthroughs so a human can watch the Redbull
 * trigger fire (or correctly NOT fire) for each kind of ability:
 *
 *   1. Redbull + Coert (cost ability)        → triggers TWICE: pay 20, draw 2
 *   2. Redbull + Coert at 15 MP (out of gas) → fires once, Redbull STAYS armed
 *   3. Redbull + Binti (excluded ability)    → fires once, Redbull is spent
 *
 * Each scene still asserts the real outcome, so it doubles as a visual
 * regression check on the Redbull activation trigger.
 *
 * Watch it:
 *   npx playwright test --project=visual --headed tests/ui/cinema/redbull-abilities-cinema.spec.js
 *   (tune pace with CINEMA=<ms>, e.g. CINEMA=2500)
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, unlockPiecies, playCardFromHand,
	getGameState, getHandSize, readOwnedMosjes,
} from '../helpers.js';

function makeBeat(page, testInfo) {
	const BEAT = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 2000 : 0);
	return (label) => { if (label) console.log(`🎬 ${label}`); return BEAT ? page.waitForTimeout(BEAT) : Promise.resolve(); };
}

async function flag(page) {
	return (await getGameState(page))?.players?.player_1?.abilityDoubleTrigger;
}
async function coertMp(page) {
	return (await readOwnedMosjes(page))[0]?.mp ?? null;
}

// Play Redbull from hand and activate it → abilityDoubleTrigger = true.
async function armRedbull(page, beat) {
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(600);
	await beat('Redbull placed on the field');
	await unlockPiecies(page, 'player_1');
	const el = page.locator('#piecies-player [data-card-id="piecie_redbull"]').first();
	await el.locator('button:has-text("Activate")').click();
	await page.waitForTimeout(600);
	expect(await flag(page)).toBe(true);
	await ss(page, 'cinema-rb-armed');
	await beat('⚡ Redbull ACTIVE — the next Mosje ability should trigger TWICE');
}

// ───────────────────────────────────────────────────────────────────────────
test('🎬 Redbull + Coert — ability triggers TWICE (pay 20, draw 2)', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);

	await seedCustomDeck(page, {
		id: 'custom_cinema_rb_coert', name: 'Redbull + Coert',
		mosjes: ['mosje_coert_tech'],   // ability: pay 10 MP → draw 1 (repeatable)
		piecies: ['piecie_redbull', 'piecie_redbull',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await beat('Scene 1 — Coert is on the field (Extra Resources: pay 10 MP, draw 1)');

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await ss(page, 'cinema-rb-coert-start');
	await beat('Coert holds Redbull + 2 cards');

	await armRedbull(page, beat);

	// Plenty of MP so BOTH 10-MP activations succeed.
	await setMosjeMP(page, 'player_1', 0, 50);
	await page.waitForTimeout(200);
	const handBefore = await getHandSize(page, 'player_1');
	const mpBefore = await coertMp(page);
	await beat(`Coert at ${mpBefore} MP, ${handBefore} cards — firing Extra Resources…`);

	await page.locator('.mosje-card--owned[data-card-id="mosje_coert_tech"] .mosje-ability-btn').click();
	await page.waitForTimeout(1000);
	await ss(page, 'cinema-rb-coert-fired');

	const handAfter = await getHandSize(page, 'player_1');
	const mpAfter = await coertMp(page);
	console.log(`🎬 RESULT — hand ${handBefore}→${handAfter} (Δ${handAfter - handBefore}), MP ${mpBefore}→${mpAfter} (paid ${mpBefore - mpAfter})`);
	await beat(`💥 TWICE — drew ${handAfter - handBefore} cards, paid ${mpBefore - mpAfter} MP`);

	expect(handAfter - handBefore).toBe(2);
	expect(mpBefore - mpAfter).toBe(20);
	expect(await flag(page)).toBeFalsy();   // Redbull spent
	await beat('Redbull consumed. 🎬 fin');
});

// ───────────────────────────────────────────────────────────────────────────
test('🎬 Redbull + Coert at 15 MP — second trigger fizzles, Redbull stays armed', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);

	await seedCustomDeck(page, {
		id: 'custom_cinema_rb_coert_low', name: 'Redbull + Coert (low MP)',
		mosjes: ['mosje_coert_tech'],
		piecies: ['piecie_redbull', 'piecie_redbull',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await beat('Scene 1 — Coert again, but running on fumes this time');

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await armRedbull(page, beat);

	// Only 15 MP — enough for ONE 10-MP activation, not two.
	await setMosjeMP(page, 'player_1', 0, 15);
	await page.waitForTimeout(200);
	const handBefore = await getHandSize(page, 'player_1');
	await beat('Coert at just 15 MP — only enough for ONE draw. Firing anyway…');

	await page.locator('.mosje-card--owned[data-card-id="mosje_coert_tech"] .mosje-ability-btn').click();
	await page.waitForTimeout(1000);
	await ss(page, 'cinema-rb-coert-fizzle');

	const handAfter = await getHandSize(page, 'player_1');
	const mpAfter = await coertMp(page);
	console.log(`🎬 RESULT — hand Δ${handAfter - handBefore}, MP 15→${mpAfter}; Redbull still armed: ${await flag(page)}`);
	await beat(`Drew ${handAfter - handBefore} card, now at ${mpAfter} MP — second trigger couldn't afford it`);

	expect(handAfter - handBefore).toBe(1);
	expect(mpAfter).toBe(5);
	expect(await flag(page)).toBe(true);    // NOT wasted — stays armed for later this turn
	await beat('🔋 Redbull NOT wasted — still armed for later this turn. 🎬 fin');
});

// ───────────────────────────────────────────────────────────────────────────
test('🎬 Redbull + Binti — excluded ability fires ONCE, Redbull is spent', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);

	await seedCustomDeck(page, {
		id: 'custom_cinema_rb_binti', name: 'Redbull + Binti',
		mosjes: ['mosje_binti'],   // Cutting Words: discard 1, opponent -10 MP + discards (target ability)
		piecies: ['piecie_redbull', 'piecie_redbull',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await beat('Scene 1 — Binti on the field (Cutting Words: opponent loses 10 MP)');

	// Give the opponent comfortable MP so the -10 is clearly visible and safe.
	const oppSlot = (await getGameState(page)).players.player_2.activeSlots.findIndex(s => s && !s.isDefeated);
	await setMosjeMP(page, 'player_2', oppSlot, 60);
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);

	await armRedbull(page, beat);

	const oppBefore = (await getGameState(page)).players.player_2.activeSlots[oppSlot].mp;
	await beat(`Opponent at ${oppBefore} MP — firing Binti's Cutting Words…`);

	await page.locator('.mosje-card--owned[data-card-id="mosje_binti"] .mosje-ability-btn').click();
	await page.waitForTimeout(700);
	// Binti asks which card to discard — pick the first.
	const discardOpt = page.locator('.modal-card-option').first();
	if (await discardOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
		await beat('Binti must discard a card to pay — choosing one…');
		await discardOpt.click();
		await page.waitForTimeout(900);
	}
	await ss(page, 'cinema-rb-binti-fired');

	const oppAfter = (await getGameState(page)).players.player_2.activeSlots[oppSlot].mp;
	console.log(`🎬 RESULT — opponent ${oppBefore}→${oppAfter} (−${oppBefore - oppAfter}); Redbull flag: ${await flag(page)}`);
	await beat(`💥 Opponent lost ${oppBefore - oppAfter} MP — ONCE, not doubled (Binti is excluded)`);

	expect(oppBefore - oppAfter).toBe(10);  // fired once, NOT 20
	expect(await flag(page)).toBeFalsy();   // Redbull spent on an ability that can't echo
	await beat('Redbull spent — excluded abilities still consume it. 🎬 fin');
});
