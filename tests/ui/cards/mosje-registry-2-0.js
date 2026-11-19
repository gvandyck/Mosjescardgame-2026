/**
 * mosje-registry-2-0.js - card-test-library entries for the 18 Example-Deck Mosjes (Obby 2.0, Phase 58).
 * Every expected number comes from the Card List ability text (docs/obby-2.0), not from engine output.
 * Format and driver: tests/helpers/mosjeCardTest.js. Start MP / levels are chosen so each number is unambiguous.
 * "milk" = Kannetje Melk (one of your Mosjes gains 25 MP, costs 0 Energy): a plain paid Piecie activation.
 * trigger.then = a second trigger fired after the first (FPS West: guess first, then the opponent plays).
 */
import { MOSJE_REGISTRY_REST } from './mosje-registry-2-0-rest.js';
import { MOSJE_REGISTRY_STARTER_A } from './mosje-registry-starter-a.js';
import { MOSJE_REGISTRY_STARTER_B } from './mosje-registry-starter-b.js';

const MILK = 'piecie_kannetje_melk';
const milk = (...slots) => slots.map(slot => ({ slot, id: MILK }));
const OPP40 = [{ id: 'mosje_ming_predictor', mp: 40 }]; // a plain, non-fresh opponent target
const OPP_HAND = ['piecie_kannetje_melk', 'piecie_affoe', 'piecie_straffoe'];
const ARM = { stack: 'PHYSICAL', id: 'quest_arm_wrestling' }; // Skilled (two 4+), Strength, win +40

export const MOSJE_REGISTRY = [
	// -- Deck 1 -------------------------------------------------------------
	{ mosje: 'mosje_alyssa_fissa', deck: 1, cases: [{
		name: 'Party Power: Place destroyed by my Piecie -> +20 MP',
		setup: { field: [{ id: 'mosje_alyssa_fissa', mp: 20 }], oppField: OPP40, place: { id: 'place_the_gym', by: 'player_2' }, piecies: [{ slot: 0, id: 'piecie_slecht_gezet' }], energy: 3 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_slecht_gezet' },
		expect: { mp: { 'own.0': 40 }, energy: 2 },
	}] },
	{ mosje: 'mosje_azn_cless', deck: 1, cases: [
		{ name: 'Risk & Reward 6: draw 2 and +10 MP',
			setup: { field: [{ id: 'mosje_azn_cless', mp: 30 }], oppField: OPP40, abilityDice: [6] },
			trigger: { kind: 'turnEnd' }, expect: { mp: { 'own.0': 40 }, handDelta: 2 } },
		{ name: 'Risk & Reward 1: discard a card from hand',
			setup: { field: [{ id: 'mosje_azn_cless', mp: 30 }], oppField: OPP40, hand: [MILK, 'piecie_affoe', 'piecie_straffoe'], abilityDice: [1] },
			trigger: { kind: 'turnEnd' }, expect: { mp: { 'own.0': 30 }, handDelta: -1 } },
	] },
	{ mosje: 'mosje_parkour_west', deck: 1, cases: [
		{ name: 'Flow: Quest success -> +20 MP on top of the Quest (10 + 40 + 20)',
			setup: { field: [{ id: 'mosje_parkour_west', mp: 10 }], oppField: OPP40, quest: ARM, dice: [5, 5, 5, 5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL' }, expect: { mp: { 'own.0': 70 } } },
		{ name: 'Flow: taksed for 30 -> loses 20 less (80 - 10)',
			setup: { field: [{ id: 'mosje_parkour_west', mp: 80 }], oppField: [{ id: 'mosje_jeffrey', mp: 50, level: 3 }] },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 70 } } },
	] },
	// -- Deck 3 -------------------------------------------------------------
	{ mosje: 'mosje_tuk_healer', deck: 3, cases: [{
		name: 'Healing Hands: pay 1 Energy, another Mosje of mine gains 20 MP',
		setup: { field: [{ id: 'mosje_tuk_healer', mp: 30 }, { id: 'mosje_ming_predictor', mp: 20, slot: 1 }], oppField: OPP40, energy: 3 },
		trigger: { kind: 'button', picks: [/Ming/] },
		expect: { mp: { 'own.0': 30, 'own.1': 40 }, energy: 2 },
	}] },
	{ mosje: 'mosje_jisca', deck: 3, cases: [
		{ name: 'Perfect Combo 4-6: a second Piecie free and an opponent Mosje loses 15 (30 + 25 + 25)',
			setup: { field: [{ id: 'mosje_jisca', mp: 30 }], oppField: OPP40, piecies: milk(0, 1), abilityDice: [5] },
			trigger: { kind: 'activatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 80, 'opp.0': 25 }, energy: 3 } },
		{ name: 'Perfect Combo 1-3: Jisca loses 10 MP (30 + 25 - 10)',
			setup: { field: [{ id: 'mosje_jisca', mp: 30 }], oppField: OPP40, piecies: milk(0, 1), abilityDice: [2] },
			trigger: { kind: 'activatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 45, 'opp.0': 40 }, energy: 3 } },
	] },
	{ mosje: 'mosje_cless_teacher', deck: 3, cases: [
		{ name: 'Teaching Moment 5-6: draw 1 and one of my Mosjes gains 5 (30 + 25 + 5)',
			setup: { field: [{ id: 'mosje_cless_teacher', mp: 30 }], oppField: OPP40, piecies: milk(0), abilityDice: [5] },
			trigger: { kind: 'activatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 60 }, handDelta: 1 } },
		{ name: 'Teaching Moment 4: nothing (4-6 needs the Martin, The Historian holder text)',
			setup: { field: [{ id: 'mosje_cless_teacher', mp: 30 }], oppField: OPP40, piecies: milk(0), abilityDice: [4] },
			trigger: { kind: 'activatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 55 }, handDelta: 0 } },
	] },
	// -- The other 14 (no Example Deck): mosje-registry-2-0-rest.js --
	// -- The 15 starter Mosjes on the 2.1 text (71-22) --
	...MOSJE_REGISTRY_STARTER_A,
	...MOSJE_REGISTRY_STARTER_B,
	...MOSJE_REGISTRY_REST,
];
