/**
 * mosje-chains-2-0.spec.js - Handoff section 6b on the real game, headless:
 *  (a) the chain rule: Jisca + Chris, The BigStepper on one paid activation -> two FREE activations, and a free Piecie never
 *      starts another chain roll (the counters show exactly one chain; the engine rule itself is unit-tested in mosjes-deck3-chain.test.ts);
 *  (b) Synergy Chamber: a holder text (Senor West's AZN Cless line) works without its partner while the Chamber is in play, and not without it.
 * Run headless only: npx playwright test -c <temporary headless config> tests/ui/cards/mosje-chains-2-0.spec.js
 */
import { test, expect } from '@playwright/test';
import { runMosjeCardTest } from '../../helpers/mosjeCardTest.js';
import { mosjeCardSetup } from '../../helpers/mosjeCardSetup.js';
import { answerModals } from '../../helpers/answerModals.js';
import { tapOwnCard, chooseTray } from '../../helpers/boardTaps.js';
import { getGameState } from '../helpers.js';

const MILK = 'piecie_kannetje_melk';
const DONER = 'piecie_broodje_doner'; // food, costs 1 Energy, +35 MP
const OPP = [{ id: 'mosje_ming_predictor', mp: 40 }];
const doners = (...slots) => slots.map(slot => ({ slot, id: DONER }));

test('chain rule: Jisca then DDR Chris on one paid activation = two free activations, no third roll', async ({ page }) => {
	test.setTimeout(60000);
	await runMosjeCardTest(page, { mosje: 'mosje_jisca', deck: null }, {
		name: 'jisca + ddr chain',
		// Dice 5 (Jisca: another Piecie free, opponent Mosje -15), 6 (DDR: another ready Piecie free), then 6s that a third roll would use.
		setup: {
			field: [{ id: 'mosje_jisca', mp: 20 }, { id: 'mosje_chris_ddr', mp: 15, slot: 1 }], oppField: OPP,
			piecies: doners(0, 1, 2), energy: 3, abilityDice: [5, 6, 6, 6],
		},
		trigger: { kind: 'activatePiecie', cardId: DONER },
		expect: {
			energy: 2, // only the first activation paid its 1 Energy
			mp: { 'opp.0': 25 }, // Jisca's 4-6: an opponent Mosje loses 15
			state: [['players.player_1.ddrChainsThisTurn', 1]],
			check: (before, after) => {
				// 3 Piecie slots: one paid + Jisca's free + DDR's free = all three activated (and swept), one DDR chain counted.
				const left = after.players.player_1.piecieSlots.filter(Boolean);
				if (left.length !== 0) throw new Error(`${left.length} Piecies still on the field, expected all three activated`);
				const dosed = after.players.player_1.graveyard.filter(c => c.cardId === 'piecie_broodje_doner').length;
				if (dosed !== 3) throw new Error(`${dosed} Doners in the discard pile, expected 3`);
			},
		},
	});
});

const CHAMBER = { id: 'place_synergy_chamber', by: 'player_2' }; // works for both players
const ARM = { stack: 'PHYSICAL', id: 'quest_arm_wrestling' }; // Skilled (two 4+), Strength, win +40
// Martin, Senor West alone: "While AZN Cless is also on your field: Strength Quest wins give +15 MP extra" (71-14 left Binti's Coert line off).
const SENOR_WEST = { field: [{ id: 'mosje_martin_senor_west', mp: 30 }], oppField: OPP, quest: ARM, dice: [5, 5, 5, 5] };

test('Synergy Chamber: Senor West gets the AZN Cless holder text without Cless while the Chamber is in play (30 + 40 + 15)', async ({ page }) => {
	test.setTimeout(60000);
	await mosjeCardSetup(page, { mosje: 'mosje_martin_senor_west' }, { setup: { ...SENOR_WEST, place: CHAMBER } });
	await tapOwnCard(page, 'mosje', 'mosje_martin_senor_west');
	await chooseTray(page, 'quest');
	// the Chamber also gives his once-per-turn look at a Quest stack: decline it by looking at one and pressing OK, then attempt
	await page.locator('.modal-mosje-select-btn:not([disabled])', { hasText: 'PHYSICAL' }).click();
	await page.locator('.modal-mosje-select-btn:not([disabled])', { hasText: 'OK' }).click();
	await page.locator('.quest-stack[data-quest-stack="PHYSICAL"]').click();
	await answerModals(page, []);
	expect((await getGameState(page)).players.player_1.activeSlots[0].mp).toBe(85);
});

test('Synergy Chamber: without the Chamber and without Cless, Senor West gets no extra (30 + 40)', async ({ page }) => {
	test.setTimeout(60000);
	await runMosjeCardTest(page, { mosje: 'mosje_martin_senor_west', deck: null }, {
		name: 'chamber off',
		setup: SENOR_WEST,
		trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/./] },
		expect: { mp: { 'own.0': 70 } },
	});
});
