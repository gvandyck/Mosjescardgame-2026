/**
 * mosje-registry-2-0.js - card-test-library entries for the 18 Example-Deck Mosjes (Obby 2.0, Phase 58).
 * Every expected number comes from the Card List ability text (docs/obby-2.0), not from engine output.
 * Format and driver: tests/helpers/mosjeCardTest.js. Start MP / levels are chosen so each number is unambiguous.
 * "milk" = Kannetje Melk (one of your Mosjes gains 25 MP, costs 0 Energy): a plain paid Piecie activation.
 * trigger.then = a second trigger fired after the first (FPS West: guess first, then the opponent plays).
 */
import { MOSJE_REGISTRY_REST } from './mosje-registry-2-0-rest.js';

const MILK = 'piecie_kannetje_melk';
const milk = (...slots) => slots.map(slot => ({ slot, id: MILK }));
const OPP40 = [{ id: 'mosje_ming_predictor', mp: 40 }]; // a plain, non-fresh opponent target
const OPP_HAND = ['piecie_kannetje_melk', 'piecie_affoe', 'piecie_straffoe'];
const ARM = { stack: 'FIGHTING', id: 'quest_arm_wrestling' }; // Skilled (two 4+), Physical, win +40

export const MOSJE_REGISTRY = [
	// -- Deck 1 -------------------------------------------------------------
	{ mosje: 'mosje_alyssa_fissa', deck: 1, cases: [{
		name: 'Party Power: Place destroyed by my Piecie -> +20 MP',
		setup: { field: [{ id: 'mosje_alyssa_fissa', mp: 20 }], oppField: OPP40, place: { id: 'place_the_gym', by: 'player_2' }, piecies: [{ slot: 0, id: 'piecie_slecht_gezet' }], energy: 3 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_slecht_gezet' },
		expect: { mp: { 'own.0': 40 }, energy: 2 },
	}] },
	{ mosje: 'mosje_gandoe_wizard', deck: 1, cases: [
		{ name: 'Chaos Roll 1-2: loses 10 MP',
			setup: { field: [{ id: 'mosje_gandoe_wizard', mp: 30 }], oppField: OPP40, abilityDice: [1] },
			trigger: { kind: 'turnStart' }, expect: { mp: { 'own.0': 20 }, state: [['players.player_1.activeSlots.0.powerBoostThisTurn', undefined]] } },
		{ name: 'Chaos Roll 5-6: +10 Power this turn',
			setup: { field: [{ id: 'mosje_gandoe_wizard', mp: 30 }], oppField: OPP40, abilityDice: [5] },
			trigger: { kind: 'turnStart' }, expect: { mp: { 'own.0': 30 }, state: [['players.player_1.activeSlots.0.powerBoostThisTurn', 10]] } },
	] },
	{ mosje: 'mosje_michelle', deck: 1, cases: [
		{ name: 'Tough Gamble 4-6: ONE doubled Quest gain (20 + 80 -> Level 2 / 0 MP)',
			setup: { field: [{ id: 'mosje_michelle', mp: 20 }], oppField: OPP40, quest: ARM, dice: [5, 5, 5, 5], abilityDice: [5] },
			trigger: { kind: 'quest', stack: 'FIGHTING' }, expect: { mp: { 'own.0': 0 }, level: { 'own.0': 2 } } },
		{ name: 'Tough Gamble 4-6 from 10 MP: 10 + 80 = 90, still Level 1 (a second doubling would level her up)',
			setup: { field: [{ id: 'mosje_michelle', mp: 10 }], oppField: OPP40, quest: ARM, dice: [5, 5, 5, 5], abilityDice: [5] },
			trigger: { kind: 'quest', stack: 'FIGHTING' }, expect: { mp: { 'own.0': 90 }, level: { 'own.0': 1 } } },
		{ name: 'Tough Gamble 1-3: half the Quest gain (40 + 20)',
			setup: { field: [{ id: 'mosje_michelle', mp: 40 }], oppField: OPP40, quest: ARM, dice: [5, 5, 5, 5], abilityDice: [2] },
			trigger: { kind: 'quest', stack: 'FIGHTING' }, expect: { mp: { 'own.0': 60 }, level: { 'own.0': 1 } } },
	] },
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
			trigger: { kind: 'quest', stack: 'FIGHTING' }, expect: { mp: { 'own.0': 70 } } },
		{ name: 'Flow: taksed for 30 -> loses 20 less (80 - 10)',
			setup: { field: [{ id: 'mosje_parkour_west', mp: 80 }], oppField: [{ id: 'mosje_jeffrey', mp: 50, level: 3 }] },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 70 } } },
	] },
	{ mosje: 'mosje_alyssa_bulldozer', deck: 1, cases: [{
		name: 'Unstoppable: taksed for 30 -> +25 MP and +10 Power (80 - 30 + 25)',
		setup: { field: [{ id: 'mosje_alyssa_bulldozer', mp: 80 }], oppField: [{ id: 'mosje_jeffrey', mp: 50, level: 3 }] },
		trigger: { kind: 'attacked' },
		expect: { mp: { 'own.0': 75 }, state: [['players.player_1.activeSlots.0.powerBoostUntilOwnerTurnEnd.amount', 10]] },
	}] },

	// -- Deck 2 -------------------------------------------------------------
	{ mosje: 'mosje_coert_tech', deck: 2, cases: [{
		name: 'Extra Resources: draw step, pay 2 Energy for 2 extra cards (plus the normal draw)',
		setup: { field: [{ id: 'mosje_coert_tech', mp: 20 }], oppField: OPP40, energy: 3 },
		trigger: { kind: 'turnStart', picks: [/Hawaiian/, /2/] },
		expect: { energy: 2, handDelta: 3 }, // 3 + 1 (turn start) - 2 paid = 2 Energy; 1 draw + 2 extra
	}] },
	{ mosje: 'mosje_hacker', deck: 2, cases: [{
		name: 'System Hack: pay 1 Energy, reverse the top 3 of my deck, +10 MP',
		setup: { field: [{ id: 'mosje_hacker', mp: 30 }], oppField: OPP40, energy: 3, pendingTargets: { deck_owner: 'player_1', order: [2, 1, 0] } },
		trigger: { kind: 'button' },
		expect: {
			mp: { 'own.0': 40 }, energy: 2,
			check: (before, after) => {
				const b = before.players.player_1.deck, a = after.players.player_1.deck;
				if (JSON.stringify(a.slice(0, 3)) !== JSON.stringify([b[2], b[1], b[0]])) throw new Error('top 3 not reversed');
				if (JSON.stringify(a.slice(3)) !== JSON.stringify(b.slice(3))) throw new Error('rest of the deck changed');
			},
		},
	}] },
	{ mosje: 'mosje_fps_coert', deck: 2, cases: [{
		name: 'Headshot Precision (6): Physical Quest success -> +30 MP and an opponent Mosje loses 15',
		setup: { field: [{ id: 'mosje_fps_coert', mp: 20 }], oppField: [{ id: 'mosje_ming_predictor', mp: 60 }], quest: ARM, dice: [5, 5, 5, 5], abilityDice: [6] },
		trigger: { kind: 'quest', stack: 'FIGHTING' },
		expect: { mp: { 'own.0': 90, 'opp.0': 45 } }, // 20 + 40 + 30; 60 - 15
	}] },
	{ mosje: 'mosje_fps_west', deck: 2, cases: [
		{ name: 'Tactical Analysis: guess Piecie, opponent plays a Piecie -> +20 MP (1 Energy)',
			setup: { field: [{ id: 'mosje_fps_west', mp: 30 }], oppField: OPP40, energy: 3, oppHand: OPP_HAND },
			trigger: { kind: 'button', picks: [/PIECIE/i], then: { kind: 'botPlayPiecie', cardId: MILK } },
			expect: { mp: { 'own.0': 50 }, energy: 2 } },
		{ name: 'Tactical Analysis: guess Place, opponent plays a Piecie -> -10 MP (1 Energy)',
			setup: { field: [{ id: 'mosje_fps_west', mp: 30 }], oppField: OPP40, energy: 3, oppHand: OPP_HAND },
			trigger: { kind: 'button', picks: [/PLACE/i], then: { kind: 'botPlayPiecie', cardId: MILK } },
			expect: { mp: { 'own.0': 20 }, energy: 2 } },
	] },
	{ mosje: 'mosje_drainer', deck: 2, cases: [{
		name: 'Continuous Drain: at the start of the opponent turn one of their Mosjes loses 5 MP',
		setup: { field: [{ id: 'mosje_drainer', mp: 30 }], oppField: OPP40 },
		trigger: { kind: 'turnStart', player: 'player_2' },
		expect: { mp: { 'opp.0': 35, 'own.0': 30 } },
	}] },
	{ mosje: 'mosje_chris', deck: 2, cases: [{
		name: 'Perfect Setup: 3 face-down Piecies -> activate one free and gain 15 MP (plus the 25 of the Piecie)',
		setup: { field: [{ id: 'mosje_chris', mp: 20 }], oppField: OPP40, piecies: milk(0, 1, 2), energy: 3 },
		trigger: { kind: 'button' },
		expect: { mp: { 'own.0': 60 }, energy: 3 }, // 20 + 15 + 25, no Energy paid
	}] },

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
	{ mosje: 'mosje_binti', deck: 3, cases: [{
		name: 'Cutting Words: pay 1 Energy + discard a Piecie -> opponent Mosje -10 MP, opponent discards 1',
		setup: { field: [{ id: 'mosje_binti', mp: 20 }], oppField: OPP40, energy: 3, hand: [MILK, 'piecie_affoe'], oppHand: OPP_HAND },
		trigger: { kind: 'button' },
		expect: { mp: { 'opp.0': 30 }, energy: 2, handDelta: -1, oppHandDelta: -1 },
	}] },
	{ mosje: 'mosje_dj_8020', deck: 3, cases: [{
		name: 'Lucky Beats: reroll a failed Quest die (coin flip 4+, +50)',
		setup: { field: [{ id: 'mosje_dj_8020', mp: 20 }], oppField: OPP40, quest: { stack: 'FIGHTING', id: 'quest_geen_raad_vraag_aad' }, dice: [1], abilityDice: [5] },
		trigger: { kind: 'quest', stack: 'FIGHTING', picks: [/Lucky Beats/] },
		expect: { mp: { 'own.0': 70 } },
	}] },
	{ mosje: 'mosje_chris_ddr', deck: 3, cases: [
		{ name: 'Perfect Combo Chain 5-6: another ready Piecie free (15 + 25 + 25)',
			setup: { field: [{ id: 'mosje_chris_ddr', mp: 15 }], oppField: OPP40, piecies: milk(0, 1, 2), abilityDice: [5] },
			trigger: { kind: 'activatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 65 }, energy: 3, state: [['players.player_1.ddrChainsThisTurn', 1]] } },
		{ name: 'Perfect Combo Chain 4: no chain (15 + 25)',
			setup: { field: [{ id: 'mosje_chris_ddr', mp: 15 }], oppField: OPP40, piecies: milk(0, 1, 2), abilityDice: [4] },
			trigger: { kind: 'activatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 40 }, state: [['players.player_1.ddrChainsThisTurn', 0]] } },
	] },
	// -- The other 14 (no Example Deck): mosje-registry-2-0-rest.js --
	...MOSJE_REGISTRY_REST,
];
