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
	setMosjeOnField, getGameState,
} from '../helpers.js';

const BULLDOZER = 'mosje_alyssa_bulldozer';

async function bulldozer(page) {
	return (await getGameState(page))?.players?.player_1?.activeSlots?.[0] ?? {};
}

// Full General-Quest modal sequence: Pay 20 MP → Attempt → Roll → Done.
async function runQuestFlow(page) {
	const yes = page.locator('#modal-yes');
	await yes.waitFor({ state: 'visible', timeout: 5000 });
	await yes.click();
	await page.waitForTimeout(300);

	const attempt = page.locator('#modal-attempt');
	await attempt.waitFor({ state: 'visible', timeout: 5000 });
	await attempt.click();
	await page.waitForTimeout(300);

	const roll = page.locator('#modal-roll');
	if (await roll.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false)) {
		await roll.click();
		await page.waitForTimeout(1800);
	}
	const done = page.locator('#modal-done');
	if (await done.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false)) {
		await done.click();
		await page.waitForTimeout(400);
	}
}

test('🎬 Bulldozer cinema — Unstoppable comeback after quest damage', async ({ page }, testInfo) => {
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
	// Force every quest dice roll to 1 → guaranteed failure (she takes the damage).
	await page.addInitScript(() => { window.__forceDiceRoll = 1; });
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Put her at Level 1 / 80 MP so she has room to take a hit.
	await setMosjeOnField(page, 'player_1', 0, BULLDOZER, { mp: 80, level: 1 });
	await ss(page, 'bulldozer-1-start');
	await beat('Scene 1 — Alyssa The Bulldozer at 80 MP (ability: comeback — +5 MP per 10 MP lost this turn)');

	const start = await bulldozer(page);
	console.log(`🎬 Start — MP ${start.mp}, lostThisTurn ${start.mpLostThisTurn || 0}`);

	// ── Scene 2: attempt a General Quest — and fail ───────────────────────────
	await beat('Scene 2 — attempting a General Quest (costs 20 MP, fails → takes damage)…');
	await page.click('#btn-general-quest');
	await page.waitForTimeout(400);
	await runQuestFlow(page);
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
