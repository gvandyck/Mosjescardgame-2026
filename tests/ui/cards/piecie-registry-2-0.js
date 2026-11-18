/**
 * piecie-registry-2-0.js - card-test-library entries for the Example-Deck Piecies (Obby 2.0, Phase 59).
 * Every expected number comes from the Card List Piecie tables (docs/obby-2.0), not from engine output.
 * Driver: tests/helpers/mosjeCardTest.js (the spec passes { mosje: piecie } as the entry id).
 * The starter food, gear, attack and substance rows (71-20) live in piecie-registry-starter-*.js and are spread in at the end; the pet and trick rows (71-21) live in piecie-registry-starter-pet-trick.js.
 * Plain targets: Ming Predictor (no Strength, no Resilient, passive-free), Michelle (Strength 2), Parkour West
 * (Strength 3, Resilient 2), Gandoe Wizard (a Gandoe, Strength 2). Opponent hand is pinned empty by the setup.
 */
import { STARTER_FOOD_GEAR_ROWS } from './piecie-registry-starter-food-gear.js';
import { STARTER_ATTACK_SUBSTANCE_ROWS } from './piecie-registry-starter-attack-substance.js';
import { STARTER_PET_TRICK_ROWS } from './piecie-registry-starter-pet-trick.js';

const MING = 'mosje_ming_predictor';
const OPP40 = [{ id: MING, mp: 40 }];
const on = (id, slot = 0) => [{ slot, id }];
const own = (id, mp = 20) => [{ id, mp }];

export const PIECIE_REGISTRY = [
	// -- MP Piecies ---------------------------------------------------------
	// -- Substance Piecies --------------------------------------------------
	{ piecie: 'piecie_grammetje_pieter', deck: 'example', section: 'Substance', cases: [
		{ name: 'roll 1-3: loses 15',
			setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_grammetje_pieter'), abilityDice: [2] },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_grammetje_pieter' }, expect: { mp: { 'own.0': 15 } } },
		{ name: 'roll 4-6: gains 30',
			setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_grammetje_pieter'), abilityDice: [5] },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_grammetje_pieter' }, expect: { mp: { 'own.0': 60 } } },
	] },
	{ piecie: 'piecie_dikke_jonko', deck: 'example', section: 'Substance', cases: [{
		name: '+25 for me, +10 for the opponent, both draw 1',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_dikke_jonko') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_dikke_jonko' }, expect: { mp: { 'own.0': 45, 'opp.0': 50 }, handDelta: 1, oppHandDelta: 1 },
	}] },
	{ piecie: 'piecie_affoe', deck: 'example', section: 'Substance', cases: [{
		name: 'opponent -15, own +10 (1 Energy)',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_affoe'), energy: 3 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_affoe' }, expect: { mp: { 'own.0': 30, 'opp.0': 25 }, energy: 2 },
	}] },
	{ piecie: 'piecie_straffoe', deck: 'example', section: 'Substance', cases: [{
		name: 'own -5, each opponent Mosje -10',
		setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_straffoe') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_straffoe' }, expect: { mp: { 'own.0': 25, 'opp.0': 30 } },
	}] },
	{ piecie: 'piecie_tikker', deck: 'example', section: 'Substance', cases: [{
		name: '+40 MP and the Tikker Stays face-up next to that Mosje',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_tikker') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_tikker' },
		expect: { mp: { 'own.0': 60 }, state: [['players.player_1.piecieSlots.0.stays', true], ['players.player_1.piecieSlots.0.blockedMosjeSlot', 0]] },
	}] },
	{ piecie: 'piecie_bong_hit_demolition', deck: 'example', section: 'Substance', cases: [{
		name: 'destroys the Place and draws 2 (2 Energy)',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_bong_hit_demolition'), place: { id: 'place_the_gym', by: 'player_2' }, energy: 3 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_bong_hit_demolition' }, expect: { handDelta: 2, energy: 1, state: [['activePlace', null]] },
	}] },
	// -- Gear Piecies -------------------------------------------------------
	{ piecie: 'piecie_boxing_gloves', deck: 'example', section: 'Gear', cases: [
		{ name: 'Strength 2 stars: +10 Power this turn (1 Energy)',
			setup: { field: own('mosje_michelle'), oppField: OPP40, piecies: on('piecie_boxing_gloves'), energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_boxing_gloves' },
			expect: { energy: 2, state: [['players.player_1.activeSlots.0.powerBoostThisTurn', 10]] } },
		{ name: 'a Gandoe gets +20 instead',
			setup: { field: own('mosje_gandoe_destroyer'), oppField: OPP40, piecies: on('piecie_boxing_gloves'), energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_boxing_gloves' },
			expect: { state: [['players.player_1.activeSlots.0.powerBoostThisTurn', 20]] } },
	] },
	// -- Attack Piecies (59-03) ----------------------------------------------
	{ piecie: 'piecie_momentum_diefje', deck: 'example', section: 'Attack', cases: [{
		name: '+10 Power this turn and the +20 MP attack flag',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_momentum_diefje') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_momentum_diefje' },
		expect: { mp: { 'own.0': 20 }, state: [['players.player_1.activeSlots.0.powerBoostThisTurn', 10], ['players.player_1.activeSlots.0.momentumDiefjeThisTurn', true]] },
	}] },
	{ piecie: 'piecie_dikke_taks', deck: 'example', section: 'Attack', cases: [
		{ name: 'Level 2: +10 Power, double-hit flag, draw 1',
			setup: { field: [{ id: MING, mp: 20, level: 2 }], oppField: OPP40, piecies: on('piecie_dikke_taks') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_dikke_taks' },
			expect: { energy: 0, handDelta: 1, state: [['players.player_1.activeSlots.0.powerBoostThisTurn', 10], ['players.player_1.activeSlots.0.hitBothOpponents', true]] } },
		{ name: 'Level 1 owner is refused: no Energy paid, nothing drawn',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_dikke_taks') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_dikke_taks' },
			expect: { energy: 3, handDelta: 0 } },
	] },
	{ piecie: 'piecie_harde_didde', deck: 'example', section: 'Attack', cases: [
		{ name: 'Level 2: a 40 MP opponent Mosje goes to the Welloe pile',
			setup: { field: [{ id: MING, mp: 20, level: 2 }], oppField: OPP40, piecies: on('piecie_harde_didde'), energy: 5 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_harde_didde' },
			expect: { energy: 1, state: [['players.player_2.welloePile.length', 1], ['players.player_2.activeSlots.0', null]] } },
		{ name: 'Level 1 owner is refused: no Energy paid',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_harde_didde'), energy: 5 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_harde_didde' },
			expect: { energy: 5 } },
		{ name: 'MP limit: an opponent Mosje with 45 MP (over 40) is not sent to the Welloe pile',
			setup: { field: [{ id: MING, mp: 20, level: 2 }], oppField: [{ id: MING, mp: 45 }], piecies: on('piecie_harde_didde'), energy: 5 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_harde_didde' },
			expect: { mp: { 'opp.0': 45 }, state: [['players.player_2.welloePile.length', 0]] } },
	] },
	{ piecie: 'piecie_klaar_met_jou', deck: 'example', section: 'Attack', cases: [{
		name: 'Level 2: a 30 MP opponent Mosje goes to the Welloe pile, draw 1',
		setup: { field: [{ id: MING, mp: 20, level: 2 }], oppField: [{ id: MING, mp: 30 }], piecies: on('piecie_klaar_met_jou'), energy: 5 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_klaar_met_jou' },
		expect: { energy: 1, handDelta: 1, state: [['players.player_2.welloePile.length', 1]] },
	}, {
		name: 'MP limit: an opponent Mosje with 35 MP (over 30) is not sent to the Welloe pile',
		setup: { field: [{ id: MING, mp: 20, level: 2 }], oppField: [{ id: MING, mp: 35 }], piecies: on('piecie_klaar_met_jou'), energy: 5 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_klaar_met_jou' },
		expect: { mp: { 'opp.0': 35 }, state: [['players.player_2.welloePile.length', 0]] }, // whether the card still draws with no legal target is not stated by the Card List
	}] },
	// -- Protection and Pet Piecies (59-03) ----------------------------------
	{ piecie: 'piecie_laat_me_chillen', deck: 'example', section: 'Utility', cases: [{
		name: 'Stays, the next loss of any own Mosje is 20 less',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_laat_me_chillen') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_laat_me_chillen' },
		expect: { energy: 2, state: [['players.player_1.piecieSlots.0.stays', true], ['players.player_1.piecieSlots.0.lossReduceOnce', 20]] },
	}] },
	{ piecie: 'piecie_vianna_poes', deck: 'example', section: 'Pet', cases: [
		{ name: 'a Mosje that is not a Cless is covered 10 less',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_vianna_poes') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_vianna_poes' },
			expect: { energy: 2, state: [['players.player_1.piecieSlots.0.boundTo.0.reduce', 10]] } },
		{ name: 'a Cless is covered 20 less',
			setup: { field: own('mosje_cless_teacher'), oppField: OPP40, piecies: on('piecie_vianna_poes') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_vianna_poes' },
			expect: { state: [['players.player_1.piecieSlots.0.boundTo.0.reduce', 20]] } },
	] },
	// -- Utility Piecies: draw, dice, chain, Place (59-04) ---------------------
	{ piecie: 'piecie_slecht_gezet', deck: 'example', section: 'Utility', cases: [
		{ name: 'the opponent Place is destroyed (1 Energy)',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_slecht_gezet'), place: { id: 'place_the_gym', by: 'player_2' } },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_slecht_gezet' }, expect: { energy: 2, state: [['activePlace', null], ['players.player_2.graveyard.0.cardId', 'place_the_gym']] } },
		{ name: 'your own Place goes back to your hand',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_slecht_gezet'), place: { id: 'place_the_gym', by: 'player_1' } },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_slecht_gezet' }, expect: { handDelta: 1, state: [['activePlace', null], ['players.player_1.hand.0.cardId', 'place_the_gym']] } },
	] },
	{ piecie: 'piecie_popo_komt', deck: 'example', section: 'Utility', cases: [
		{ name: '3 Mosjes on the field: the Place is destroyed (0 Energy)',
			setup: { field: [{ slot: 0, id: MING, mp: 20 }, { slot: 1, id: 'mosje_binti', mp: 20 }], oppField: OPP40, piecies: on('piecie_popo_komt'), place: { id: 'place_the_gym', by: 'player_2' } },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_popo_komt' }, expect: { energy: 3, state: [['activePlace', null]] } },
		{ name: 'only 2 Mosjes: refused, the Place stays',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_popo_komt'), place: { id: 'place_the_gym', by: 'player_2' } },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_popo_komt' }, expect: { energy: 3, state: [['activePlace', 'place_the_gym']] } },
	] },
	{ piecie: 'piecie_huisbaas', deck: 'example', section: 'Utility', cases: [
		{ name: 'a substance Piecie on top of the discard pile: destroy the Place, search a Place and play it (1 + 3 Energy)',
			setup: { field: own(MING), oppField: OPP40, energy: 6, piecies: on('piecie_huisbaas'), graveyard: ['piecie_affoe'], deckTop: ['place_arcade'], place: { id: 'place_the_gym', by: 'player_2' } },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_huisbaas', picks: [/Arcade/] },
			expect: { energy: 2, state: [['activePlace', 'place_arcade'], ['activePlacePlayedBy', 'player_1']] } },
		{ name: 'no substance Piecie on top of a discard pile: refused, the Place stays',
			setup: { field: own(MING), oppField: OPP40, energy: 6, piecies: on('piecie_huisbaas'), place: { id: 'place_the_gym', by: 'player_2' } },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_huisbaas' },
			expect: { energy: 6, state: [['activePlace', 'place_the_gym']] } },
	] },
	// -- MP / Substance / Gear / Pet rest + MP Amplifier, Synergy Field (59-05) ----------------------
	{ piecie: 'piecie_chefs_special', deck: 'example', section: 'MP', cases: [
		{ name: 'alone: +15 MP',
			setup: { field: own(MING, 0), oppField: OPP40, piecies: on('piecie_chefs_special') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_chefs_special' }, expect: { mp: { 'own.0': 15 }, energy: 2 } },
		{ name: "with Ronald: 15 per Piecie in the opponent's hand (2 -> +30), plus his +10 on the first food Piecie (D-10)",
			setup: { field: [{ slot: 0, id: MING, mp: 0 }, { slot: 1, id: 'mosje_ronald_chef', mp: 20 }], oppField: OPP40, piecies: on('piecie_chefs_special'), oppHand: ['piecie_pot_of_weed', 'piecie_harde_didde'] },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_chefs_special', picks: [{ index: 0 }] }, expect: { mp: { 'own.0': 40 } } },
	] },
	{ piecie: 'piecie_warm_kannetje_melk', deck: 'example', section: 'MP', cases: [{
		name: '-10 MP and draw 2',
		setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_warm_kannetje_melk') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_warm_kannetje_melk' }, expect: { mp: { 'own.0': 20 }, handDelta: 2 },
	}] },
	{ piecie: 'piecie_stripje_bennies', deck: 'example', section: 'Substance', cases: [{
		name: 'draw 3 and -20 MP',
		setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_stripje_bennies') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_stripje_bennies' }, expect: { mp: { 'own.0': 10 }, handDelta: 3 },
	}] },
	{ piecie: 'piecie_pot_of_weed', deck: 'example', section: 'Substance', cases: [{
		name: 'draw 2 (1 Energy)',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_pot_of_weed') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_pot_of_weed' }, expect: { handDelta: 2, energy: 2 },
	}] },
	{ piecie: 'piecie_skipping_rope', deck: 'example', section: 'Gear', cases: [{
		name: 'draw 1, and +1 die with a Strength 1 star Mosje',
		setup: { field: own('mosje_michelle'), oppField: OPP40, piecies: on('piecie_skipping_rope') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_skipping_rope' }, expect: { handDelta: 1, state: [['players.player_1.questExtraDice', 1]] },
	}] },
	{ piecie: 'piecie_tony', deck: 'example', section: 'Pet', cases: [{
		name: 'covers the named Coert, KasteLuck 20 less',
		setup: { field: own('mosje_coert_kasteluck'), oppField: OPP40, piecies: on('piecie_tony') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_tony' },
		expect: { energy: 2, state: [['players.player_1.piecieSlots.0.boundTo.0.reduce', 20]] },
	}] },
	{ piecie: 'piecie_katjegang', deck: 'example', section: 'Pet', cases: [{
		name: 'covers an Alyssa 20 less',
		setup: { field: own('mosje_alyssa_bulldozer'), oppField: OPP40, piecies: on('piecie_katjegang') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_katjegang' },
		expect: { energy: 2, state: [['players.player_1.piecieSlots.0.boundTo.0.reduce', 20]] },
	}] },
	{ piecie: 'piecie_gekke_vogels', deck: 'example', section: 'Pet', cases: [{
		name: 'Jisca + an Alyssa + a staying KatjeGang: both get 15 MP at the start of the next turn',
		setup: { field: [{ slot: 0, id: 'mosje_jisca', mp: 20 }, { slot: 1, id: 'mosje_alyssa_bulldozer', mp: 20 }], oppField: OPP40, energy: 6,
			piecies: [{ slot: 0, id: 'piecie_katjegang' }, { slot: 1, id: 'piecie_gekke_vogels' }], abilityDice: [2] },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_katjegang', picks: [{ index: 0 }], then: { kind: 'activatePiecie', cardId: 'piecie_gekke_vogels', picks: [{ index: 0 }] } },
		expect: { state: [['players.player_1.piecieSlots.1.startGain.length', 2], ['players.player_1.piecieSlots.1.startGain.0.amount', 15]] },
	}] },
	// -- Attack rest, Utility dice rest and draw rest (59-06) ------------------
	{ piecie: 'piecie_tweede_kans', deck: 'rest', section: 'Utility', cases: [{
		name: 'one reroll of any Quest roll this turn',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_tweede_kans') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_tweede_kans' },
		expect: { energy: 3, state: [['players.player_1.rerollGrants.0.scope', 'anyQuest'], ['players.player_1.rerollGrants.0.uses', 1]] },
	}] },
	{ piecie: 'piecie_kan_het', deck: 'rest', section: 'Utility', cases: [
		{ name: 'a 5 gains 40 MP', setup: { field: own(MING, 20), oppField: OPP40, piecies: on('piecie_kan_het'), abilityDice: [5] },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_kan_het' }, expect: { mp: { 'own.0': 60 } } },
		{ name: 'a 4 loses 10 MP', setup: { field: own(MING, 20), oppField: OPP40, piecies: on('piecie_kan_het'), abilityDice: [4] },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_kan_het' }, expect: { mp: { 'own.0': 10 } } },
	] },
	{ piecie: 'piecie_f1_telemetry', deck: 'rest', section: 'Utility', cases: [{
		name: '+15 MP and draw 1',
		setup: { field: own(MING, 20), oppField: OPP40, piecies: on('piecie_f1_telemetry') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_f1_telemetry' }, expect: { mp: { 'own.0': 35 }, handDelta: 1, energy: 2 },
	}, {
		name: 'with Martin, The Precision Driver: he gains 30 (not the chosen Mosje) and you draw 2',
		setup: { field: [{ id: MING, mp: 20 }, { slot: 1, id: 'mosje_martin_driver', mp: 20 }], oppField: OPP40, piecies: on('piecie_f1_telemetry') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_f1_telemetry' }, expect: { mp: { 'own.0': 20, 'own.1': 50 }, handDelta: 2 },
	}] },
	// -- Chain / swap (59-07) -----------------------------------------------
	{ piecie: 'piecie_leipe_swap', deck: 'rest', section: 'Utility', cases: [{
		name: 'swaps the MP of your Mosje (20) and the opponent Mosje (40) for good, no level change (4 Energy)',
		setup: { field: own(MING, 20), oppField: OPP40, piecies: on('piecie_leipe_swap'), energy: 6 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_leipe_swap' }, expect: { mp: { 'own.0': 40, 'opp.0': 20 }, energy: 2 },
	}] },
	{ piecie: 'piecie_dubbele_ding', deck: 'rest', section: 'Utility', cases: [{
		name: 'with nothing activatable in hand only the 2 Energy is paid',
		setup: { field: [{ id: MING, mp: 20, level: 2 }], oppField: OPP40, piecies: on('piecie_dubbele_ding'), hand: [], energy: 6 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_dubbele_ding' }, expect: { energy: 4 },
	}] },
	// -- Protect / Welloe / wildcard (59-08) --------------------------------
	{ piecie: 'piecie_welloe_force', deck: 'rest', section: 'Utility', cases: [{
		name: 'discards 1 hand card as part of the cost (2 Energy) and Stays until the start of your next turn',
		setup: { field: own(MING, 20), oppField: OPP40, piecies: on('piecie_welloe_force'), energy: 5, hand: ['piecie_kannetje_melk'] },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_welloe_force' },
		expect: { energy: 3, handDelta: -1, state: [['players.player_1.piecieSlots.0.stays', true], ['players.player_1.piecieSlots.0.staysEnd', 'startOfNextTurn']] },
	}] },
	{ piecie: 'piecie_mosje_reborn', deck: 'rest', section: 'Utility', cases: [{
		name: 'a Welloe-pile Mosje comes back at Level 1 with starting MP 20 + 30 (2 Energy)',
		setup: { field: own(MING, 20), oppField: OPP40, piecies: on('piecie_mosje_reborn'), energy: 5, welloe: ['mosje_jeffrey'] },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_mosje_reborn', picks: [{ index: 0 }] },
		expect: { energy: 3, mp: { 'own.1': 50 }, level: { 'own.1': 1 }, state: [['players.player_1.welloePile.length', 0], ['players.player_1.activeSlots.1.cardId', 'mosje_jeffrey']] },
	}] },
	{ piecie: 'piecie_call_of_welloes', deck: 'rest', section: 'Utility', cases: [{
		name: 'a Welloe-pile Mosje comes back at Level 1 with starting MP 20; card and Mosje are linked (1 Energy)',
		setup: { field: own(MING, 20), oppField: OPP40, piecies: on('piecie_call_of_welloes'), energy: 5, welloe: ['mosje_jeffrey'] },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_call_of_welloes', picks: [{ index: 0 }] },
		expect: { energy: 4, mp: { 'own.1': 20 }, level: { 'own.1': 1 }, state: [['players.player_1.piecieSlots.0.linkedMosjeCardId', 'mosje_jeffrey'], ['players.player_1.activeSlots.1.summonedByPiecie', 'piecie_call_of_welloes']] },
	}] },
	{ piecie: 'piecie_dingetje_toch', deck: 'rest', section: 'Utility', cases: [{
		name: 'played by itself it is just discarded (0 Energy); the wildcard use is covered by the engine tests',
		setup: { field: own(MING, 20), oppField: OPP40, piecies: on('piecie_dingetje_toch'), energy: 3 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_dingetje_toch' },
		expect: { energy: 3, state: [['players.player_1.piecieSlots.0', null]] },
	}] },
	// -- Starter food, gear, attack and substance Piecies on the 2.1 text (71-20) ---------------------
	...STARTER_FOOD_GEAR_ROWS,
	...STARTER_ATTACK_SUBSTANCE_ROWS,
	// -- Starter pet and trick Piecies on the 2.1 text (71-21); rows of the archived Piecies are gone (D-35) ---------
	...STARTER_PET_TRICK_ROWS,
];
