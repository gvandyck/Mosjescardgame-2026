/**
 * gandoe-michelle-synergy.spec.js - Michelle, Iron Tuk (Tough Gamble) on the Obby 2.0 board.
 *
 * Card List: "when this Mosje succeeds at a Quest, roll a die: 1-3 it gets half the MP, 4-6 it gets double."
 * Ruling (Phase 58): Michelle doubles/halves only the Quest's OWN win MP, as ONE modifier of the single gain
 * (40 + 65 doubled is wrong; 20 + 40 doubled = 100 -> Level 2 / 0 MP). The old Gandoe kicker (+10 MP for Gandoe,
 * The Destroyer) is a V4 rule and is gone: Michelle's synergy is Bowie & Stormey, not Gandoe.
 * Real game, headless, via the Mosje card-test driver (dice are scripted with the testMode dice hooks).
 */
import { test } from '@playwright/test';
import { runMosjeCardTest } from '../../helpers/mosjeCardTest.js';

const ARM = { stack: 'FIGHTING', id: 'quest_arm_wrestling' }; // Skilled, Physical, win +40
const OPP = [{ id: 'mosje_ming_predictor', mp: 40 }];
const quest = { kind: 'quest', stack: 'FIGHTING' };

const CASES = [
	{
		name: 'roll 5: ONE doubled gain takes Michelle (20 MP) to Level 2 with 0 MP; Gandoe, The Destroyer gets no kicker',
		setup: { field: [{ id: 'mosje_michelle', mp: 20 }, { id: 'mosje_gandoe_destroyer', mp: 40, slot: 1 }], oppField: OPP, quest: ARM, dice: [5, 5, 5, 5], abilityDice: [5] },
		expect: { mp: { 'own.0': 0, 'own.1': 40 }, level: { 'own.0': 2, 'own.1': 1 } },
	},
	{
		name: 'roll 4: still doubled (10 + 80 = 90, Level 1), no kicker for Gandoe, The Destroyer',
		setup: { field: [{ id: 'mosje_michelle', mp: 10 }, { id: 'mosje_gandoe_destroyer', mp: 40, slot: 1 }], oppField: OPP, quest: ARM, dice: [5, 5, 5, 5], abilityDice: [4] },
		expect: { mp: { 'own.0': 90, 'own.1': 40 }, level: { 'own.0': 1 } },
	},
	{
		name: 'roll 5 never gives Gandoe, The Unpredictable Wizard anything either',
		setup: { field: [{ id: 'mosje_michelle', mp: 10 }, { id: 'mosje_gandoe_wizard', mp: 40, slot: 1 }], oppField: OPP, quest: ARM, dice: [5, 5, 5, 5], abilityDice: [5] },
		expect: { mp: { 'own.0': 90, 'own.1': 40 } },
	},
	{
		name: 'roll 2: half the Quest gain (40 + 20 = 60)',
		setup: { field: [{ id: 'mosje_michelle', mp: 40 }], oppField: OPP, quest: ARM, dice: [5, 5, 5, 5], abilityDice: [2] },
		expect: { mp: { 'own.0': 60 }, level: { 'own.0': 1 } },
	},
];

for (const c of CASES) {
	test(`Michelle Tough Gamble (2.0): ${c.name}`, async ({ page }) => {
		test.setTimeout(60000);
		await runMosjeCardTest(page, { mosje: 'mosje_michelle', deck: 1 }, { ...c, trigger: quest });
	});
}
