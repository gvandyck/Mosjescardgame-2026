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
];
