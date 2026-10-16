/**
 * place-registry-2-0.js - card-test-library entries for the Power Places (Obby 2.0, Phase 60-04, EFX-04 part 1).
 * Numbers come from the Card List Place table (docs/obby-2.0), not from engine output.
 * Driver: tests/helpers/mosjeCardTest.js (the spec passes { mosje: place } as the entry id); trigger 'none' reads the board as laid out.
 * Mosjes: Bulldozer (Fighting, L1 Power 20), Ming Natural (Digital, 10), Tuk Healer (Artistic, 0, a Tuk), Michelle (Fighting 10),
 * Gandoe Destroyer (Fighting 20).
 */
const BULL = 'mosje_alyssa_bulldozer';
const DIG = 'mosje_ming_natural';
const ART = 'mosje_tuk_healer';
const GANDOE = 'mosje_gandoe_destroyer';
const OPP = [{ id: 'mosje_ming_predictor', mp: 40 }];
const NONE = { kind: 'none' };
const at = (place, id, extra = {}) => ({ field: [{ id, mp: 50, ...extra.f }], oppField: OPP, place: { id: place, by: 'player_2' }, ...extra.s });
const power = (name, place, id, n, extra) => ({ name, setup: at(place, id, extra), trigger: NONE, expect: { power: { 'own.0': n } } });
const fresh = (place, id, n) => ({ name: 'a fresh Mosje ignores it', setup: at(place, id, { f: { fresh: true } }), trigger: NONE, expect: { power: { 'own.0': n } } });

const turn = (place, name, id, mp, after, f = {}) => ({ name, setup: { field: [{ id, mp, ...f }], oppField: OPP, place: { id: place, by: 'player_2' } }, trigger: { kind: 'turnStart' }, expect: { mp: { 'own.0': after } } });
const quest = (place, name, dice, after) => ({ name, setup: { field: [{ id: DIG, mp: 40 }], oppField: OPP, place: { id: place, by: 'player_2' }, quest: { stack: 'DIGITAL', id: 'quest_quick_thinking' }, dice }, trigger: { kind: 'quest', stack: 'DIGITAL' }, expect: { mp: { 'own.0': after } } });

export const PLACE_REGISTRY = [
	{ place: 'place_the_gym', deck: 'example', cases: [
		power('Fighting Power 20 -> 30', 'place_the_gym', BULL, 30),
		power('Digital Power 10 stays 10', 'place_the_gym', DIG, 10),
		fresh('place_the_gym', BULL, 20),
		{ name: 'an attack by a Fighting Power 20 Mosje takes 30 MP',
			setup: { field: [{ id: ART, mp: 50 }], oppField: [{ id: BULL, mp: 40 }], place: { id: 'place_the_gym', by: 'player_2' } },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 20 } } },
	] },
	{ place: 'place_boxing_ring', deck: 'example', cases: [
		power('Fighting Power 20 -> 30', 'place_boxing_ring', BULL, 30),
		power('a Gandoe gets +20 -> 40', 'place_boxing_ring', GANDOE, 40),
		power('Digital Power 10 -> 0', 'place_boxing_ring', DIG, 0),
		power('Artistic Power 0 stays 0', 'place_boxing_ring', ART, 0),
		fresh('place_boxing_ring', DIG, 10),
	] },
	{ place: 'place_de_box', deck: 'example', cases: [
		power('a Michelle +10 -> 20', 'place_de_box', 'mosje_michelle', 20),
		power('a Tuk +10 -> 10', 'place_de_box', ART, 10),
		power('a Gandoe +10 -> 30', 'place_de_box', GANDOE, 30),
		power('anyone else +0', 'place_de_box', BULL, 20),
		fresh('place_de_box', 'mosje_michelle', 10),
	] },
	{ place: 'place_arcade', deck: 'example', cases: [
		power('Fighting Power 20 -> 10', 'place_arcade', BULL, 10),
		power('Digital Power 10 stays 10', 'place_arcade', DIG, 10),
		fresh('place_arcade', BULL, 20),
	] },
	{ place: 'place_skiffa', deck: 'example', cases: [
		power('Digital Power 10 -> 0', 'place_skiffa', DIG, 0),
		power('Fighting Power 20 stays 20', 'place_skiffa', BULL, 20),
		fresh('place_skiffa', DIG, 10),
	] },
	{ place: 'place_bank_chilling', deck: 'example', cases: [
		power('every Mosje -10: Fighting 20 -> 10', 'place_bank_chilling', BULL, 10),
		power('Power 0 never goes below 0', 'place_bank_chilling', ART, 0),
		fresh('place_bank_chilling', BULL, 20),
	] },
	{ place: 'place_drain_zone', deck: 'rest', cases: [
		power('every Mosje +10: Digital 10 -> 20', 'place_drain_zone', DIG, 20),
		power('Fighting 20 -> 30', 'place_drain_zone', BULL, 30),
		fresh('place_drain_zone', DIG, 10),
	] },
	{ place: 'place_dierenasiel', deck: 'rest', cases: [
		power('no staying pet Piecie: -10 (20 -> 10)', 'place_dierenasiel', BULL, 10),
		power('a staying pet Piecie: no change', 'place_dierenasiel', BULL, 20, { s: { piecies: [{ slot: 0, id: 'piecie_vianna_poes', faceDown: false, stays: 'endOfNextTurn' }] } }),
		fresh('place_dierenasiel', BULL, 20),
	] },
	// Phase 60-05 (EFX-04 part 2): turn-start, dice and Quest-MP Places. Fresh Mosjes are laid out with fresh:true.
	{ place: 'place_the_gym', deck: 'example', part: 'turn start', cases: [
		turn('place_the_gym', 'a non-Fighting Mosje loses 10 at its owner turn start (40 -> 30)', DIG, 40, 30),
		turn('place_the_gym', 'a Fighting Mosje is unchanged (40)', BULL, 40, 40),
		turn('place_the_gym', 'a fresh Mosje is unchanged (40)', DIG, 40, 40, { fresh: true }),
	] },
	{ place: 'place_bank_chilling', deck: 'rest', part: 'turn start', cases: [
		turn('place_bank_chilling', 'a Social 2+ Mosje gains 10 (40 -> 50)', ART, 40, 50),
		turn('place_bank_chilling', 'a Mosje without Social stars gains nothing (40)', DIG, 40, 40),
		turn('place_bank_chilling', 'a fresh Social Mosje gains nothing (40)', ART, 40, 40, { fresh: true }),
	] },
	{ place: 'place_eendjes_voeren', deck: 'example', part: 'turn start', cases: [
		turn('place_eendjes_voeren', 'a Michelle gains 10 (30 -> 40)', 'mosje_michelle', 30, 40),
		turn('place_eendjes_voeren', 'another Mosje gains nothing (40)', BULL, 40, 40),
		turn('place_eendjes_voeren', 'a fresh Michelle gains nothing (30)', 'mosje_michelle', 30, 30, { fresh: true }),
	] },
	{ place: 'place_skiffa', deck: 'example', part: 'reroll', cases: [{
		name: 'an Artistic Mosje may reroll 1 die on its Quest roll (1,1 fails; reroll die 1 -> 6 wins +25)',
		setup: { field: [{ id: ART, mp: 50 }], oppField: OPP, place: { id: 'place_skiffa', by: 'player_2' }, quest: { stack: 'ARTISTIC', id: 'quest_inspire_crowd' }, dice: [1, 1], abilityDice: [6] },
		trigger: { kind: 'quest', stack: 'ARTISTIC', picks: [/Reroll die 1/] }, expect: { mp: { 'own.0': 75 } },
	}] },
	{ place: 'place_tesla', deck: 'example', part: 'play', cases: [
		{ name: 'cannot be played without a Coert on your field',
			setup: { field: [{ id: DIG, mp: 40 }], oppField: OPP, hand: ['place_tesla'] },
			trigger: { kind: 'playFromHand', cardId: 'place_tesla' }, expect: { energy: 3, handDelta: 0, state: [['activePlace', null]] } },
		{ name: 'can be played with a Coert on your field (3 Energy)',
			setup: { field: [{ id: 'mosje_coert_kasteluck', mp: 40 }], oppField: OPP, hand: ['place_tesla'] },
			trigger: { kind: 'playFromHand', cardId: 'place_tesla' }, expect: { energy: 0, handDelta: -1, state: [['activePlace', 'place_tesla']] } },
	] },
	{ place: 'place_quest_haven', deck: 'rest', part: 'quest', cases: [
		quest('place_quest_haven', 'a Quest win gives 10 more (+25 -> 40 + 35 = 75)', [5, 5, 5], 75),
		quest('place_quest_haven', 'a Quest loss is unchanged (-15 -> 25)', [1, 1, 1], 25),
	] },
	{ place: 'place_obby_1', deck: 'rest', part: 'quest', cases: [
		quest('place_obby_1', 'a Quest win gives 10 more (40 + 35 = 75)', [5, 5, 5], 75),
		quest('place_obby_1', 'a Quest loss costs 10 more (-25 -> 15)', [1, 1, 1], 15),
	] },
	{ place: 'place_digital_gaming_stop', deck: 'rest', part: 'gear', cases: [
		{ name: 'activating a gear Piecie also draws 1 card (Skipping Rope 1 + Place 1)',
			setup: { field: [{ id: 'mosje_michelle', mp: 20 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_skipping_rope' }], place: { id: 'place_digital_gaming_stop', by: 'player_2' } },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_skipping_rope' }, expect: { handDelta: 2 } },
		{ name: 'a non-gear Piecie draws nothing extra',
			setup: { field: [{ id: 'mosje_michelle', mp: 20 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_broodje_doner' }], place: { id: 'place_digital_gaming_stop', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_broodje_doner' }, expect: { handDelta: 0 } },
	] },
	{ place: 'place_momentum_stabilizer', deck: 'rest', part: 'loss cap', cases: [
		{ name: 'an attack of Power 40 takes 30 (80 -> 50)',
			setup: { field: [{ id: ART, mp: 80 }], oppField: [{ id: BULL, mp: 40, powerBoost: 20 }], place: { id: 'place_momentum_stabilizer', by: 'player_2' } },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 50 } } },
		{ name: 'an attack of Power 20 is unchanged (80 -> 60)',
			setup: { field: [{ id: ART, mp: 80 }], oppField: [{ id: BULL, mp: 40 }], place: { id: 'place_momentum_stabilizer', by: 'player_2' } },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 60 } } },
	] },
	{ place: 'place_zo_is_natuur', deck: 'rest', part: 'attack', cases: [
		{ name: 'Resilient 2 (Bulldozer) attacked for 20 loses 10 (50 -> 40)',
			setup: { field: [{ id: BULL, mp: 50 }], oppField: [{ id: BULL, mp: 40 }], place: { id: 'place_zo_is_natuur', by: 'player_2' } },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 40 } } },
		{ name: 'a non-Resilient Mosje (Ming) attacked for 20 loses 20 (50 -> 30)',
			setup: { field: [{ id: DIG, mp: 50 }], oppField: [{ id: BULL, mp: 40 }], place: { id: 'place_zo_is_natuur', by: 'player_2' } },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 30 } } },
	] },
	{ place: 'place_the_void', deck: 'rest', part: 'gains', cases: [
		{ name: 'Kannetje Melk (+25) gives 0 and is still spent',
			setup: { field: [{ id: DIG, mp: 40 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_kannetje_melk' }], place: { id: 'place_the_void', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_kannetje_melk' }, expect: { mp: { 'own.0': 40 } } },
		{ name: 'a Quest win still gains (40 + 25 = 65)', setup: quest('place_the_void', '', [5, 5, 5], 65).setup,
			trigger: { kind: 'quest', stack: 'DIGITAL' }, expect: { mp: { 'own.0': 65 } } },
		{ name: 'losses are not blocked: an attack of Power 20 takes 20 (50 -> 30)',
			setup: { field: [{ id: ART, mp: 50 }], oppField: [{ id: BULL, mp: 40 }], place: { id: 'place_the_void', by: 'player_2' } },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 30 } } },
	] },
	{ place: 'place_coerts_caravan', deck: 'rest', part: 'free Piecie', cases: [
		{ name: 'with a Coert the first Piecie costs 0 Energy (3 stays 3)',
			setup: { field: [{ id: 'mosje_coert_kasteluck', mp: 40 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_broodje_doner' }], place: { id: 'place_coerts_caravan', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_broodje_doner' }, expect: { energy: 3 } },
		{ name: 'without a Coert the Piecie costs its 1 Energy (3 -> 2)',
			setup: { field: [{ id: DIG, mp: 40 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_broodje_doner' }], place: { id: 'place_coerts_caravan', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_broodje_doner' }, expect: { energy: 2 } },
	] },
	{ place: 'place_delluft', deck: 'rest', part: 'parking fee', cases: [
		{ name: 'the first payment on your turn costs 1 more (Piecie 1 + fee 1: 3 -> 1)',
			setup: { field: [{ id: DIG, mp: 40 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_broodje_doner' }], place: { id: 'place_delluft', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_broodje_doner' }, expect: { energy: 1 } },
		{ name: 'a Coert on the field pays no fee (3 -> 2)',
			setup: { field: [{ id: 'mosje_coert_kasteluck', mp: 40 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_broodje_doner' }], place: { id: 'place_delluft', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_broodje_doner' }, expect: { energy: 2 } },
		{ name: 'a Cless pays 2 more (1 + 2: 3 -> 0)',
			setup: { field: [{ id: 'mosje_cless_teacher', mp: 40 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_broodje_doner' }], place: { id: 'place_delluft', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_broodje_doner' }, expect: { energy: 0 } },
		{ name: 'a payment it cannot cover with the fee is refused: nothing paid (1 stays 1)',
			setup: { field: [{ id: DIG, mp: 40 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_broodje_doner' }], place: { id: 'place_delluft', by: 'player_2' }, energy: 1 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_broodje_doner' }, expect: { energy: 1 } },
	] },
	{ place: 'place_welloe_graveyard', deck: 'example', part: 'cost', cases: [
		{ name: 'Harde Didde costs 3 instead of 4 (5 -> 2) and still sends the Mosje to the Welloe pile',
			setup: { field: [{ id: 'mosje_ming_predictor', mp: 20, level: 2 }], oppField: [{ id: 'mosje_ming_predictor', mp: 40 }], piecies: [{ slot: 0, id: 'piecie_harde_didde' }], place: { id: 'place_welloe_graveyard', by: 'player_2' }, energy: 5 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_harde_didde' }, expect: { energy: 2, state: [['players.player_2.welloePile.length', 1]] } },
	] },
	{ place: 'place_dierenasiel', deck: 'rest', part: 'cost', cases: [
		{ name: 'a pet Piecie (Vianna Poes) costs 0 Energy (3 stays 3)',
			setup: { field: [{ id: BULL, mp: 40 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_vianna_poes' }], place: { id: 'place_dierenasiel', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_vianna_poes' }, expect: { energy: 3 } },
	] },
	{ place: 'place_synergy_chamber', deck: 'example', part: 'holder text', cases: [
		{ name: "Binti's Coert holder text works without a Coert (20 + 25 + 10 = 55)",
			setup: { field: [{ id: 'mosje_binti', mp: 20 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_kannetje_melk' }], place: { id: 'place_synergy_chamber', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_kannetje_melk' }, expect: { mp: { 'own.0': 55 } } },
		{ name: 'without the Chamber and without a Coert Binti gets no extra (20 + 25 = 45)',
			setup: { field: [{ id: 'mosje_binti', mp: 20 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_kannetje_melk' }], energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_kannetje_melk' }, expect: { mp: { 'own.0': 45 } } },
	] },
];
