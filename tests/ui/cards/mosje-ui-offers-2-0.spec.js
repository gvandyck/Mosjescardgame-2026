/**
 * mosje-ui-offers-2-0.spec.js - the two holder-text offers added in 58-11 (engine rules came with 58-10):
 *  - Martin, The Historian + Cless, The Teacher: Time Control on your own deck may put 1 of the 5 cards into your hand.
 *  - Martin, Senor West + AZN Cless: once per turn, look at the top card of a Quest stack before attempting a Quest.
 * Real game, headless, through the generic option modal.
 */
import { test, expect } from '@playwright/test';
import { runMosjeCardTest } from '../../helpers/mosjeCardTest.js';
import { mosjeCardSetup } from '../../helpers/mosjeCardSetup.js';
import { getGameState, setQuestFaceUp } from '../helpers.js';
import { QUESTS } from '../../../src/data/quests.js';
import { tapOwnCard, chooseTray, cancelSelection } from '../../helpers/boardTaps.js';

const OPP = [{ id: 'mosje_ming_predictor', mp: 40 }];

test('Martin, The Historian (Cless, The Teacher on the field): Time Control keeps 1 of the top 5 in hand', async ({ page }) => {
	test.setTimeout(60000);
	await runMosjeCardTest(page, { mosje: 'mosje_martin_historian', deck: null }, {
		name: 'keep 1',
		setup: { field: [{ id: 'mosje_martin_historian', mp: 30 }, { id: 'mosje_cless_teacher', mp: 30, slot: 1 }], oppField: OPP },
		// draw step: Time Control, my own deck, keep the top-5 order as it is (4 asks, the last is automatic), then keep option #2 (= the first card).
		trigger: { kind: 'turnStart', picks: [/Historian/, /Your deck/, /./, /./, /./, /./, { index: 1 }] },
		expect: {
			mp: { 'own.0': 45 }, // 30 + 15, and the normal draw is replaced
			handDelta: 1, // the kept card only
			check: (before, after) => {
				const b = before.players.player_1.deck, a = after.players.player_1.deck;
				expect(after.players.player_1.hand.map(c => c.cardId)).toContain(b[0].cardId);
				expect(a.slice(0, 4).map(c => c.cardId)).toEqual(b.slice(1, 5).map(c => c.cardId));
			},
		},
	});
});

test('Martin, Senor West (AZN Cless on the field): look at the top of a Quest stack once per turn, before attempting', async ({ page }) => {
	test.setTimeout(60000);
	await mosjeCardSetup(page, { mosje: 'mosje_martin_senor_west' }, {
		setup: { field: [{ id: 'mosje_martin_senor_west', mp: 30 }, { id: 'mosje_azn_cless', mp: 30, slot: 1 }], oppField: OPP },
	});
	// Pin a plain Steady Quest face-up so "Attempt which Quest?" always has a choice
	// (random face-up Quests could all be un-attemptable -> "No Quest available" flake).
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out');
	const state = await getGameState(page);
	const top = state.questStacks.FIGHTING.deck[0];
	const topName = QUESTS.find(q => q.id === (typeof top === 'object' ? top.cardId : top)).name;
	const option = page.locator('.modal-mosje-select-btn:not([disabled])');

	const chooseQuest = page.locator('#status-strip[data-status-kind="choose-quest"]'); // the Quest tiles light up (was the "Attempt which Quest?" picker)
	await tapOwnCard(page, 'mosje', 'mosje_martin_senor_west'); // the acting Mosje
	await chooseTray(page, 'quest');
	await expect(page.locator('.modal-card h3')).toContainText('Senor West');
	await option.filter({ hasText: 'FIGHTING' }).click();
	await expect(page.locator('.modal-card p')).toHaveText(topName);
	await option.filter({ hasText: 'OK' }).click();
	await expect(chooseQuest).toBeVisible();
	await cancelSelection(page);
	expect((await getGameState(page)).players.player_1.westPeekTurn).toBe(state.turnNumber);

	// Used up: the second attempt this turn goes straight to the Quest choice.
	await tapOwnCard(page, 'mosje', 'mosje_martin_senor_west');
	await chooseTray(page, 'quest');
	await expect(chooseQuest).toBeVisible();
	await expect(page.locator('.modal-card h3', { hasText: 'Senor West' })).toHaveCount(0);
	await cancelSelection(page);
});
