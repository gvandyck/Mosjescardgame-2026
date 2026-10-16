/**
 * snelle-registry-2-0.js - card-test-library entries for the Obby 2.0 Snelle (Phase 60).
 * Every expected number comes from the Card List Snelle table (docs/obby-2.0), not from engine output.
 * Driver: tests/helpers/mosjeCardTest.js (the spec passes { mosje: snelle } as the entry id). Energy starts at 3.
 * Plain Mosjes: Ming Predictor (no stars that matter), Michelle (Physical 2). Opponent hand is pinned empty (no windows).
 * Trigger kinds: playSnelle (own hand, through the UI), botPlaySnelle / botQuest (the bot acts, for the reaction cards).
 */
const MING = 'mosje_ming_predictor';
const MICHELLE = 'mosje_michelle';
const OPP40 = [{ id: MING, mp: 40 }];
const BANK = { id: 'place_bank_chilling', by: 'player_2' };

export const SNELLE_REGISTRY = [
	{ snelle: 'snelle_momentum_rush', deck: 'example', cases: [
		{ name: 'one Mosje gains 15 MP for 0 Energy',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_momentum_rush'] },
			trigger: { kind: 'playSnelle', cardId: 'snelle_momentum_rush' }, expect: { mp: { 'own.0': 35 }, energy: 3, handDelta: -1 } },
		{ name: 'two Mosjes: the pick gains 15, the other stays',
			setup: { field: [{ slot: 0, id: MING, mp: 20 }, { slot: 1, id: MICHELLE, mp: 20 }], oppField: OPP40, hand: ['snelle_momentum_rush'] },
			trigger: { kind: 'playSnelle', cardId: 'snelle_momentum_rush', picks: [{ index: 1 }] }, expect: { mp: { 'own.0': 20, 'own.1': 35 }, energy: 3 } },
	] },
	{ snelle: 'snelle_bijna_welloe', deck: 'example', cases: [
		{ name: 'only the Mosje with 10 MP or less gains 20',
			setup: { field: [{ slot: 0, id: MING, mp: 40 }, { slot: 1, id: MICHELLE, mp: 10 }], oppField: OPP40, hand: ['snelle_bijna_welloe'] },
			trigger: { kind: 'playSnelle', cardId: 'snelle_bijna_welloe' }, expect: { mp: { 'own.0': 40, 'own.1': 30 }, energy: 3 } },
		{ name: 'Only if: no Mosje at 10 MP or less -> refused, card kept, nothing paid',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_bijna_welloe'] },
			trigger: { kind: 'playSnelle', cardId: 'snelle_bijna_welloe' }, expect: { mp: { 'own.0': 20 }, energy: 3, handDelta: 0 } },
	] },
	{ snelle: 'snelle_ff_haaltje_nemen', deck: 'example', cases: [
		{ name: 'draw 2 cards for 2 Energy',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_ff_haaltje_nemen'] },
			trigger: { kind: 'playSnelle', cardId: 'snelle_ff_haaltje_nemen' }, expect: { energy: 1, handDelta: 1 } },
		{ name: 'deck of 1 card: draws only that card',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_ff_haaltje_nemen'], deckSize: 1 },
			trigger: { kind: 'playSnelle', cardId: 'snelle_ff_haaltje_nemen' }, expect: { energy: 1, handDelta: 0 } },
		{ name: 'empty deck: draws nothing, no penalty',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_ff_haaltje_nemen'], deckSize: 0 },
			trigger: { kind: 'playSnelle', cardId: 'snelle_ff_haaltje_nemen' }, expect: { energy: 1, handDelta: -1, state: [['players.player_1.cooldownTurn', undefined]] } },
	] },
	{ snelle: 'snelle_chillingsvoorbij', deck: 'example', cases: [
		{ name: 'two Places in the discard: the most recent one comes back',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_chillingsvoorbij'], graveyard: ['place_boxing_ring', 'place_bank_chilling'] },
			trigger: { kind: 'playSnelle', cardId: 'snelle_chillingsvoorbij' },
			expect: { energy: 2, state: [['players.player_1.hand.0.cardId', 'place_boxing_ring'], ['players.player_1.graveyard.0.cardId', 'place_bank_chilling']] } },
		{ name: 'no Place in the discard -> refused, nothing paid',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_chillingsvoorbij'] },
			trigger: { kind: 'playSnelle', cardId: 'snelle_chillingsvoorbij' }, expect: { energy: 3, handDelta: 0 } },
	] },
	{ snelle: 'snelle_jantje_jantje_jantje', deck: 'example', cases: [
		{ name: 'Bank Chilling: opponent Mosje -15, own Mosje +15',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_jantje_jantje_jantje'], place: BANK },
			trigger: { kind: 'playSnelle', cardId: 'snelle_jantje_jantje_jantje' }, expect: { mp: { 'own.0': 35, 'opp.0': 25 }, energy: 3 } },
		{ name: 'Only while Bank Chilling: no Place -> refused',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_jantje_jantje_jantje'] },
			trigger: { kind: 'playSnelle', cardId: 'snelle_jantje_jantje_jantje' }, expect: { mp: { 'own.0': 20, 'opp.0': 40 }, handDelta: 0 } },
	] },
];
