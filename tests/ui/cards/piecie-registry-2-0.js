/**
 * piecie-registry-2-0.js - card-test-library entries for the Example-Deck Piecies (Obby 2.0, Phase 59).
 * Every expected number comes from the Card List Piecie tables (docs/obby-2.0), not from engine output.
 * Driver: tests/helpers/mosjeCardTest.js (the spec passes { mosje: piecie } as the entry id).
 * Plain targets: Ming Predictor (no Physical, no Resilient, passive-free), Michelle (Physical 2), Parkour West
 * (Physical 3, Resilient 2), Gandoe Wizard (a Gandoe, Physical 2). Opponent hand is pinned empty by the setup.
 */
const MING = 'mosje_ming_predictor';
const OPP40 = [{ id: MING, mp: 40 }];
const on = (id, slot = 0) => [{ slot, id }];
const own = (id, mp = 20) => [{ id, mp }];

export const PIECIE_REGISTRY = [
	// -- MP Piecies ---------------------------------------------------------
	{ piecie: 'piecie_kannetje_melk', deck: 'example', section: 'MP', cases: [{
		name: '+25 MP',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_kannetje_melk') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_kannetje_melk' }, expect: { mp: { 'own.0': 45 }, energy: 3 },
	}] },
	{ piecie: 'piecie_broodje_doner', deck: 'example', section: 'MP', cases: [{
		name: '+35 MP for 1 Energy',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_broodje_doner'), energy: 3 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_broodje_doner' }, expect: { mp: { 'own.0': 55 }, energy: 2 },
	}] },
	{ piecie: 'piecie_eendjes_voeren', deck: 'example', section: 'MP', cases: [
		{ name: "Nature's Gift: Resilient below 2 stars -> +30",
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_eendjes_voeren') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_eendjes_voeren' }, expect: { mp: { 'own.0': 50 } } },
		{ name: "Nature's Gift: Resilient 2 stars -> +40",
			setup: { field: own('mosje_parkour_west'), oppField: OPP40, piecies: on('piecie_eendjes_voeren') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_eendjes_voeren' }, expect: { mp: { 'own.0': 60 } } },
	] },
	{ piecie: 'piecie_protein_shake', deck: 'example', section: 'MP', cases: [
		{ name: 'Physical 2 stars -> +25',
			setup: { field: own('mosje_michelle'), oppField: OPP40, piecies: on('piecie_protein_shake') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_protein_shake' }, expect: { mp: { 'own.0': 45 } } },
		{ name: 'Physical 3 stars -> +35',
			setup: { field: own('mosje_parkour_west'), oppField: OPP40, piecies: on('piecie_protein_shake') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_protein_shake' }, expect: { mp: { 'own.0': 55 } } },
		{ name: 'Physical 2 stars in the Boxing Ring -> +35',
			setup: { field: own('mosje_michelle'), oppField: OPP40, piecies: on('piecie_protein_shake'), place: { id: 'place_boxing_ring', by: 'player_2' } },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_protein_shake' }, expect: { mp: { 'own.0': 55 } } },
	] },
	{ piecie: 'piecie_varkenspootjes', deck: 'example', section: 'MP', cases: [
		{ name: 'a non-Binti Mosje loses 15',
			setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_varkenspootjes'), energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_varkenspootjes', picks: [{ index: 0 }] },
			expect: { mp: { 'own.0': 15, 'opp.0': 40 }, energy: 2 } },
		{ name: 'a Binti gains 40',
			setup: { field: own('mosje_binti', 20), oppField: OPP40, piecies: on('piecie_varkenspootjes'), energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_varkenspootjes', picks: [/Binti/] },
			expect: { mp: { 'own.0': 60 } } },
	] },
	{ piecie: 'piecie_momentum_boost', deck: 'example', section: 'MP', cases: [
		{ name: '+15 MP now',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_momentum_boost') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_momentum_boost' }, expect: { mp: { 'own.0': 35 } } },
		{ name: 'flags the Mosje for +10 more on a Quest win this turn',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_momentum_boost') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_momentum_boost' },
			expect: { mp: { 'own.0': 35 }, state: [['players.player_1.activeSlots.0.momentumBoostWin', true]] } },
	] },
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
	{ piecie: 'piecie_larry_zegeltje', deck: 'example', section: 'Substance', cases: [
		{ name: 'roll 1-2: loses 25 and discards 1',
			setup: { field: own(MING, 40), oppField: OPP40, piecies: on('piecie_larry_zegeltje'), abilityDice: [1], hand: ['piecie_affoe'] },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_larry_zegeltje' }, expect: { mp: { 'own.0': 15 }, handDelta: -1 } },
		{ name: 'roll 3-4: gains 20',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_larry_zegeltje'), abilityDice: [3] },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_larry_zegeltje' }, expect: { mp: { 'own.0': 40 } } },
		{ name: 'roll 5-6: gains 40 and draws 2',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_larry_zegeltje'), abilityDice: [6] },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_larry_zegeltje' }, expect: { mp: { 'own.0': 60 }, handDelta: 2 } },
	] },
	{ piecie: 'piecie_bong_hit_demolition', deck: 'example', section: 'Substance', cases: [{
		name: 'destroys the Place and draws 2 (2 Energy)',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_bong_hit_demolition'), place: { id: 'place_the_gym', by: 'player_2' }, energy: 3 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_bong_hit_demolition' }, expect: { handDelta: 2, energy: 1, state: [['activePlace', null]] },
	}] },
	// -- Gear Piecies -------------------------------------------------------
	{ piecie: 'piecie_keyboard', deck: 'example', section: 'Gear', cases: [{
		name: 'with a Digital Mosje: +10 MP and draw 1',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_keyboard') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_keyboard' }, expect: { mp: { 'own.0': 30 }, handDelta: 1 },
	}] },
	{ piecie: 'piecie_controller', deck: 'example', section: 'Gear', cases: [{
		name: 'with a Digital Mosje: +10 MP and +1 die on one Quest this turn',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_controller') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_controller' }, expect: { mp: { 'own.0': 30 }, state: [['players.player_1.questExtraDice', 1]] },
	}] },
	{ piecie: 'piecie_boxing_gloves', deck: 'example', section: 'Gear', cases: [
		{ name: 'Physical 2 stars: +10 Power this turn (1 Energy)',
			setup: { field: own('mosje_michelle'), oppField: OPP40, piecies: on('piecie_boxing_gloves'), energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_boxing_gloves' },
			expect: { energy: 2, state: [['players.player_1.activeSlots.0.powerBoostThisTurn', 10]] } },
		{ name: 'a Gandoe gets +20 instead',
			setup: { field: own('mosje_gandoe_wizard'), oppField: OPP40, piecies: on('piecie_boxing_gloves'), energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_boxing_gloves' },
			expect: { state: [['players.player_1.activeSlots.0.powerBoostThisTurn', 20]] } },
	] },
	// -- Attack Piecies (59-03) ----------------------------------------------
	{ piecie: 'piecie_te_hard_gaan', deck: 'example', section: 'Attack', cases: [
		{ name: '+20 Power this turn (2 Energy), the -10 MP is scheduled for the end of the turn',
			setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_te_hard_gaan') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_te_hard_gaan' },
			expect: { energy: 1, mp: { 'own.0': 30 }, state: [['players.player_1.activeSlots.0.powerBoostThisTurn', 20], ['players.player_1.endOfTurnLosses.0.amount', 10]] } },
		{ name: 'at the end of the turn it loses 10 MP',
			setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_te_hard_gaan') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_te_hard_gaan', then: { kind: 'turnEnd' } },
			expect: { mp: { 'own.0': 20 } } },
	] },
	{ piecie: 'piecie_super_saiyan_mos', deck: 'example', section: 'Attack', cases: [{
		name: '+30 Power this turn',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_super_saiyan_mos') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_super_saiyan_mos' },
		expect: { mp: { 'own.0': 20 }, state: [['players.player_1.activeSlots.0.powerBoostThisTurn', 30]] },
	}] },
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
	] },
	{ piecie: 'piecie_klaar_met_jou', deck: 'example', section: 'Attack', cases: [{
		name: 'Level 2: a 30 MP opponent Mosje goes to the Welloe pile, draw 1',
		setup: { field: [{ id: MING, mp: 20, level: 2 }], oppField: [{ id: MING, mp: 30 }], piecies: on('piecie_klaar_met_jou'), energy: 5 },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_klaar_met_jou' },
		expect: { energy: 1, handDelta: 1, state: [['players.player_2.welloePile.length', 1]] },
	}] },
	// -- Protection and Pet Piecies (59-03) ----------------------------------
	{ piecie: 'piecie_afblijven', deck: 'example', section: 'Utility', cases: [{
		name: 'Stays, the chosen Mosje loses 10 less per loss (1 Energy)',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_afblijven') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_afblijven' },
		expect: { energy: 2, state: [['players.player_1.piecieSlots.0.stays', true], ['players.player_1.piecieSlots.0.boundTo.0.reduce', 10]] },
	}] },
	{ piecie: 'piecie_laat_me_chillen', deck: 'example', section: 'Utility', cases: [{
		name: 'Stays, the next loss of any own Mosje is 20 less',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_laat_me_chillen') },
		trigger: { kind: 'activatePiecie', cardId: 'piecie_laat_me_chillen' },
		expect: { energy: 2, state: [['players.player_1.piecieSlots.0.stays', true], ['players.player_1.piecieSlots.0.lossReduceOnce', 20]] },
	}] },
	{ piecie: 'piecie_bowie_stormey', deck: 'example', section: 'Pet', cases: [
		{ name: 'a Mosje that is not named is covered 10 less',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_bowie_stormey') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_bowie_stormey' },
			expect: { energy: 2, state: [['players.player_1.piecieSlots.0.boundTo.0.reduce', 10]] } },
		{ name: 'the named Michelle is covered 20 less',
			setup: { field: own('mosje_michelle'), oppField: OPP40, piecies: on('piecie_bowie_stormey') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_bowie_stormey' },
			expect: { state: [['players.player_1.piecieSlots.0.boundTo.0.reduce', 20]] } },
		{ name: 'Gandoe + Michelle: both covered 20 less, each gains 10 at the start of the next turn',
			setup: { field: [{ slot: 0, id: 'mosje_gandoe_wizard', mp: 20 }, { slot: 1, id: 'mosje_michelle', mp: 20 }], oppField: OPP40, piecies: on('piecie_bowie_stormey') },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_bowie_stormey', picks: [{ index: 0 }] },
			expect: { state: [['players.player_1.piecieSlots.0.boundTo.0.reduce', 20], ['players.player_1.piecieSlots.0.boundTo.1.reduce', 20], ['players.player_1.piecieSlots.0.startGain.length', 2]] } },
	] },
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
];
