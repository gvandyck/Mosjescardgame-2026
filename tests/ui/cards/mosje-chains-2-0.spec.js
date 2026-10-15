/**
 * mosje-chains-2-0.spec.js - Handoff section 6b on the real game, headless:
 *  (a) the chain rule: Jisca + Dancing/DDR Chris on one paid activation -> two FREE activations, and a free Piecie never
 *      starts another chain roll (the counters show exactly one chain; the engine rule itself is unit-tested in mosjes-deck3-chain.test.ts);
 *  (b) Synergy Chamber: a holder text works without its partner while the Chamber is in play, and not without it.
 * Run headless only: npx playwright test -c <temporary headless config> tests/ui/cards/mosje-chains-2-0.spec.js
 */
import { test, expect } from '@playwright/test';
import { runMosjeCardTest } from '../../helpers/mosjeCardTest.js';

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
const BINTI_FOOD = {
	field: [{ id: 'mosje_binti', mp: 20 }], oppField: OPP, piecies: [{ slot: 0, id: MILK }], energy: 3,
};

test('Synergy Chamber: Binti\'s Coert holder text works without Coert while the Chamber is in play (20 + 25 + 10)', async ({ page }) => {
	test.setTimeout(60000);
	await runMosjeCardTest(page, { mosje: 'mosje_binti', deck: null }, {
		name: 'chamber on',
		setup: { ...BINTI_FOOD, place: CHAMBER },
		trigger: { kind: 'activatePiecie', cardId: MILK },
		expect: { mp: { 'own.0': 55 } },
	});
});

test('Synergy Chamber: without the Chamber and without Coert, Binti gets no extra (20 + 25)', async ({ page }) => {
	test.setTimeout(60000);
	await runMosjeCardTest(page, { mosje: 'mosje_binti', deck: null }, {
		name: 'chamber off',
		setup: BINTI_FOOD,
		trigger: { kind: 'activatePiecie', cardId: MILK },
		expect: { mp: { 'own.0': 45 } },
	});
});
