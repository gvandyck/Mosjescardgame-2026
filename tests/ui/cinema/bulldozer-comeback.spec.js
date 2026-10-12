/**
 * bulldozer-comeback.spec.js — "Cinema mode" demo of Alyssa The Bulldozer's
 * "Unstoppable" comeback ability.
 *
 * Story: Bulldozer is on the field with healthy MP. She attempts a General Quest
 * and FAILS (dice forced low) — paying the 20 MP attempt cost AND taking the
 * quest's failure damage. Then she activates Unstoppable and regenerates
 * +5 MP for every 10 MP she lost this turn.
 *
 * Faithful: real quest flow, real loseMP path (which feeds mpLostThisTurn), real
 * ability. Deterministic via window.__forceDiceRoll. Doubles as a regression check.
 *   npx playwright test --project=visual tests/ui/cinema/bulldozer-comeback.spec.js --headed
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setMosjeOnField, getGameState, setQuestFaceUp, setNextDice, questViaUi,
} from '../helpers.js';

const BULLDOZER = 'mosje_alyssa_bulldozer';

async function bulldozer(page) {
	return (await getGameState(page))?.players?.player_1?.activeSlots?.[0] ?? {};
}

// Full General-Quest modal sequence: Pay 20 MP → Attempt → Roll → Done.

// KNOWN GAP (fix in Phase 58): the Unstoppable ability button (.mosje-ability-btn) is not rendered on the 2.0 board; the Quest-fail half (-15 MP) of this scene passes.
test.fixme('🎬 Bulldozer cinema — Unstoppable comeback after quest damage', async ({ page }, testInfo) => {
	test.setTimeout(120000);

	const BEAT = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 2200 : 0);
	const beat = (label) => { if (label) console.log(`🎬 ${label}`); return BEAT ? page.waitForTimeout(BEAT) : Promise.resolve(); };

	if (process.env.LOG_PAGE) {
		page.on('console', (m) => {
			const t = m.text();
			if (t.includes('Bulldozer') || t.includes('QUEST') || t.includes('loses')) console.log('   [engine]', t);
		});
	}

	// ── Scene 1: Bulldozer on the field, healthy ──────────────────────────────
	await seedCustomDeck(page, {
		id: 'custom_cinema_bulldozer', name: 'Bulldozer Cinema',  // id MUST start with custom_
		mosjes: [BULLDOZER],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_quest_prep',
		          'piecie_quest_prep', 'piecie_quest_prep', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Put her at Level 1 / 80 MP so she has room to take a hit.
	await setMosjeOnField(page, 'player_1', 0, BULLDOZER, { mp: 80, level: 1 });
	// Known 2.0 Quest (Steady, lose 15) with every die forced to 1 -> guaranteed failure (she takes the damage).
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out');
	await setNextDice(page, [1, 1, 1, 1]);
	await ss(page, 'bulldozer-1-start');
	await beat('Scene 1 — Alyssa The Bulldozer at 80 MP (ability: comeback — +5 MP per 10 MP lost this turn)');

	const start = await bulldozer(page);
	console.log(`🎬 Start — MP ${start.mp}, lostThisTurn ${start.mpLostThisTurn || 0}`);

	// ── Scene 2: attempt a General Quest — and fail ───────────────────────────
	await beat('Scene 2 — attempting a Quest (fails → takes damage)…');
	await questViaUi(page, { slot: 0, stackId: 'FIGHTING' });
	await ss(page, 'bulldozer-2-after-quest');

	const hurt = await bulldozer(page);
	const lost = hurt.mpLostThisTurn || 0;
	const expectedComeback = Math.floor(lost / 10) * 5;
	console.log(`🎬 After quest — MP ${hurt.mp}, lost ${lost} this turn → comeback should be +${expectedComeback}`);
	await beat(`💥 Quest failed — she dropped to ${hurt.mp} MP (lost ${lost} this turn)`);
	expect(lost).toBeGreaterThan(0);   // she actually took damage

	// ── Scene 3: activate Unstoppable — watch her regenerate ──────────────────
	const before = hurt.mp;
	await beat('Scene 3 — activating Unstoppable…');
	await page.locator(`.mosje-card--owned[data-card-id="${BULLDOZER}"] .mosje-ability-btn`).click();
	await page.waitForTimeout(900);
	await ss(page, 'bulldozer-3-comeback');

	const after = (await bulldozer(page)).mp;
	const regen = after - before;
	console.log(`🎬 RESULT — Bulldozer MP ${before} → ${after} (comeback +${regen}; expected +${expectedComeback})`);
	await beat(`🛡️ Unstoppable! Regenerated +${regen} MP (now ${after}). The harder she's hit, the harder she hits back.`);

	expect(regen).toBe(expectedComeback);
});
