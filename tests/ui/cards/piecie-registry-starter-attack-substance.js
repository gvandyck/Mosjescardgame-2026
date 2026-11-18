/**
 * piecie-registry-starter-attack-substance.js - card-test-library rows for the starter attack and substance Piecies (Phase 71-20, D-35 b).
 * Every expected number comes from the 2.1 card text in docs/obby-2.0/handover/card-list.md, not from engine output.
 * Ming Predictor: Power 10, no passive. Ronald Chef: a Ronald, Power 10. Youri: a Youri, Power 5.
 */
const MING = 'mosje_ming_predictor';
const OPP40 = [{ id: MING, mp: 40 }];
const on = (id, slot = 0) => [{ slot, id }];
const own = (id, mp = 20) => [{ id, mp }];
const act = (cardId, extra = {}) => ({ kind: 'activatePiecie', cardId, ...extra });
const end = (player, then) => ({ kind: 'turnEnd', player, ...(then ? { then } : {}) });

export const STARTER_ATTACK_SUBSTANCE_ROWS = [
	// -- Attack -------------------------------------------------------------
	{ piecie: 'piecie_kleine_taks', deck: 'starter', section: 'Attack', cases: [
		{ name: 'Target: the card stays in its slot (1 Energy), nothing lost yet',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_kleine_taks') },
			trigger: act('piecie_kleine_taks'), expect: { energy: 2, mp: { 'opp.0': 40 }, state: [['players.player_1.piecieSlots.0.cardId', 'piecie_kleine_taks']] } },
		{ name: 'first tick at the end of this turn: the opponent Mosje loses 10 MP, the card stays',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_kleine_taks') },
			trigger: act('piecie_kleine_taks', { then: end('player_1') }),
			expect: { mp: { 'opp.0': 30 }, state: [['players.player_1.piecieSlots.0.cardId', 'piecie_kleine_taks']] } },
		{ name: 'second tick at the end of your next turn: 20 lost in all, the card leaves its slot',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_kleine_taks') },
			trigger: act('piecie_kleine_taks', { then: end('player_1', end('player_2', end('player_1'))) }),
			expect: { mp: { 'opp.0': 20 }, state: [['players.player_1.piecieSlots.0', null]] } },
	] },
	{ piecie: 'piecie_snoeiertje', deck: 'starter', section: 'Attack', cases: [
		{ name: 'alone: +10 Power this turn (0 Energy), no MP lost',
			setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_snoeiertje') },
			trigger: act('piecie_snoeiertje'), expect: { mp: { 'own.0': 30 }, power: { 'own.0': 20 }, energy: 3 } },
		{ name: 'Combo, as the 2nd Piecie of the turn: +20 Power',
			setup: { field: own(MING, 30), oppField: OPP40, piecies: [{ slot: 0, id: 'piecie_kannetje_melk' }, { slot: 1, id: 'piecie_snoeiertje' }] },
			trigger: act('piecie_kannetje_melk', { then: act('piecie_snoeiertje') }), expect: { mp: { 'own.0': 55 }, power: { 'own.0': 30 } } },
	] },
	{ piecie: 'piecie_super_saiyan_mos', deck: 'starter', section: 'Attack', cases: [{
		name: '+30 Power this turn (3 Energy)',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_super_saiyan_mos') },
		trigger: act('piecie_super_saiyan_mos'), expect: { mp: { 'own.0': 20 }, power: { 'own.0': 40 }, energy: 0 },
	}] },
	{ piecie: 'piecie_te_hard_gaan', deck: 'starter', section: 'Attack', cases: [
		{ name: 'the Mosje pays 10 MP first, then gets +20 Power (2 Energy)',
			setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_te_hard_gaan') },
			trigger: act('piecie_te_hard_gaan'), expect: { mp: { 'own.0': 20 }, power: { 'own.0': 30 }, energy: 1 } },
		{ name: 'no Mosje can pay the 10 MP: refused, no Energy paid, no Power',
			setup: { field: own(MING, 5), oppField: OPP40, piecies: on('piecie_te_hard_gaan') },
			trigger: act('piecie_te_hard_gaan'), expect: { mp: { 'own.0': 5 }, power: { 'own.0': 10 }, energy: 3, state: [['players.player_1.piecieSlots.0.activated', false]] } },
		{ name: 'the 10 MP is paid once only: nothing more is lost at the end of the turn',
			setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_te_hard_gaan') },
			trigger: act('piecie_te_hard_gaan', { then: end('player_1') }), expect: { mp: { 'own.0': 20 } } },
	] },
	// -- Substance ----------------------------------------------------------
	{ piecie: 'piecie_blikje_monsteros', deck: 'starter', section: 'Substance', cases: [
		{ name: 'the Mosje loses 15 MP, +2 Energy this turn (0 Energy to play), no draw',
			setup: { field: own(MING, 30), oppField: OPP40, piecies: on('piecie_blikje_monsteros') },
			trigger: act('piecie_blikje_monsteros'), expect: { mp: { 'own.0': 15 }, energy: 5, handDelta: 0 } },
		{ name: 'a Youri also draws 1',
			setup: { field: own('mosje_youri', 30), oppField: OPP40, piecies: on('piecie_blikje_monsteros') },
			trigger: act('piecie_blikje_monsteros'), expect: { mp: { 'own.0': 15 }, energy: 5, handDelta: 1 } },
		{ name: 'no Mosje can pay 15 MP: refused, no Energy gained',
			setup: { field: own(MING, 10), oppField: OPP40, piecies: on('piecie_blikje_monsteros') },
			trigger: act('piecie_blikje_monsteros'), expect: { mp: { 'own.0': 10 }, energy: 3, state: [['players.player_1.piecieSlots.0.activated', false]] } },
	] },
	{ piecie: 'piecie_larry_zegeltje', deck: 'starter', section: 'Substance', cases: [
		{ name: 'roll 2 (1-2): the Mosje loses 25 MP, no card discarded',
			setup: { field: own(MING, 40), oppField: OPP40, piecies: on('piecie_larry_zegeltje'), abilityDice: [2], hand: ['piecie_affoe'] },
			trigger: act('piecie_larry_zegeltje'), expect: { mp: { 'own.0': 15 }, handDelta: 0 } },
		{ name: 'roll 3 (3-4): gains 20 MP',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_larry_zegeltje'), abilityDice: [3] },
			trigger: act('piecie_larry_zegeltje'), expect: { mp: { 'own.0': 40 }, handDelta: 0 } },
		{ name: 'roll 4 (3-4): gains 20 MP',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_larry_zegeltje'), abilityDice: [4] },
			trigger: act('piecie_larry_zegeltje'), expect: { mp: { 'own.0': 40 }, handDelta: 0 } },
		{ name: 'roll 5 (5-6): gains 40 MP and you draw 2',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_larry_zegeltje'), abilityDice: [5] },
			trigger: act('piecie_larry_zegeltje'), expect: { mp: { 'own.0': 60 }, handDelta: 2 } },
	] },
	{ piecie: 'piecie_ronalds_fles_fireman', deck: 'starter', section: 'Substance', cases: [
		{ name: 'another Mosje loses 20 MP and gets +20 Power (1 Energy)',
			setup: { field: own(MING, 40), oppField: OPP40, piecies: on('piecie_ronalds_fles_fireman') },
			trigger: act('piecie_ronalds_fles_fireman'), expect: { mp: { 'own.0': 20 }, power: { 'own.0': 30 }, energy: 2 } },
		{ name: 'a Ronald loses nothing and still gets +20 Power',
			setup: { field: own('mosje_ronald_chef', 40), oppField: OPP40, piecies: on('piecie_ronalds_fles_fireman') },
			trigger: act('piecie_ronalds_fles_fireman'), expect: { mp: { 'own.0': 40 }, power: { 'own.0': 30 }, energy: 2 } },
	] },
];
