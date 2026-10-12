/**
 * quest-success.spec.js — "Cinema mode" demo of a SUCCESSFUL quest.
 *
 * A Mosje attempts a General Quest with the dice forced HIGH (6) so it succeeds,
 * showing the green flash + ✓ badge (the success counterpart to the Bulldozer
 * cinema's red ✗ fail). Faithful: real quest flow + real dice override.
 *   npx playwright test --project=visual tests/ui/cinema/quest-success.spec.js --headed
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setMosjeOnField, getGameState, setQuestFaceUp, setNextDice, questViaUi,
} from '../helpers.js';

const HERO = 'mosje_alyssa_bulldozer';

async function hero(page) {
	return (await getGameState(page))?.players?.player_1?.activeSlots?.[0] ?? {};
}


test('🎬 Quest success cinema — green flash + ✓ badge', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const BEAT = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 2200 : 0);
	const beat = (label) => { if (label) console.log(`🎬 ${label}`); return BEAT ? page.waitForTimeout(BEAT) : Promise.resolve(); };

	await seedCustomDeck(page, {
		id: 'custom_cinema_questwin', name: 'Quest Win Cinema',
		mosjes: [HERO],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_quest_prep',
		          'piecie_quest_prep', 'piecie_quest_prep', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeOnField(page, 'player_1', 0, HERO, { mp: 50, level: 1 });
	// Inject a known standard roll-based general quest so the flow is deterministic
	// (the random deck can otherwise serve a guess-type quest with a different modal).
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out');
	await setNextDice(page, [6, 6, 6]); // every die a 6 -> guaranteed success
	await ss(page, 'questwin-1-start');
	await beat('Scene 1 — Mosje at 50 MP, about to attempt a General Quest (dice forced to win)');

	await beat('Scene 2 — attempting the quest…');
	await questViaUi(page, { slot: 0, stackId: 'FIGHTING' });
	await ss(page, 'questwin-2-result');
	await beat('✅ Quest SUCCESS — green flash + ✓ badge on the Mosje');

	// It resolved (the quest attempt counter advanced) and the board survived.
	const gs = await getGameState(page);
	expect(gs?.players?.player_1?.questsAttemptedThisTurn ?? 0).toBeGreaterThan(0);
	await beat('🎬 fin');
});
