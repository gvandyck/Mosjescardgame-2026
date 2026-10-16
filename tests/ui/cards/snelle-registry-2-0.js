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
const ATTACKER = [{ id: 'mosje_jeffrey', mp: 50, level: 3 }]; // 30 Power, non-fresh
const ARM = { stack: 'FIGHTING', id: 'quest_arm_wrestling' };
const QUICK = { stack: 'DIGITAL', id: 'quest_quick_thinking' };
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

	// -- 60-02: protection + dice Snelle. The bot (Jeffrey L3, 30 Power) taksed the first Mosje; the human answers the Reaction prompt. --
	{ snelle: 'snelle_emergency_healings', deck: 'example', cases: [
		{ name: 'taksed for 30 at 40 MP: +35 first (Resilient 2), then -30 -> 45',
			setup: { field: [{ id: MICHELLE, mp: 40 }], oppField: ATTACKER, hand: ['snelle_emergency_healings'] },
			trigger: { kind: 'attacked', picks: [/Emergency Healings/] }, expect: { mp: { 'own.0': 45 }, energy: 2, handDelta: -1 } },
	] },
	{ snelle: 'snelle_the_protector', deck: 'example', cases: [
		{ name: 'taksed for 30: loses 30 less -> no loss, for 0 Energy',
			setup: { field: [{ id: MING, mp: 80 }], oppField: ATTACKER, hand: ['snelle_the_protector'] },
			trigger: { kind: 'attacked', picks: [/The Protector/] }, expect: { mp: { 'own.0': 80 }, energy: 3, handDelta: -1 } },
	] },
	{ snelle: 'snelle_perfect_dodge', deck: 'example', cases: [
		{ name: 'Needs Physical 2: taksed for 30 -> loses 20 less (80 - 10)',
			setup: { field: [{ id: MICHELLE, mp: 80 }], oppField: ATTACKER, hand: ['snelle_perfect_dodge'] },
			trigger: { kind: 'attacked', picks: [/Perfect Dodge/] }, expect: { mp: { 'own.0': 70 }, energy: 1, handDelta: -1 } },
	] },
	{ snelle: 'snelle_drain_reversal', deck: 'example', cases: [
		{ name: 'taksed for 30: loses 20 less (70), one opponent Mosje loses a fixed 10 (40)',
			setup: { field: [{ id: MING, mp: 80 }], oppField: ATTACKER, hand: ['snelle_drain_reversal'] },
			trigger: { kind: 'attacked', picks: [/Drain Reversal/] }, expect: { mp: { 'own.0': 70, 'opp.0': 40 }, energy: 1, handDelta: -1 } },
	] },
	{ snelle: 'snelle_negate_elimination', deck: 'example', cases: [
		{ name: 'sideways Mosje taksed to the Welloe pile: stays sideways at 5 MP, Welloe pile empty',
			setup: { field: [{ id: MING, mp: 5, sideways: true }], oppField: ATTACKER, hand: ['snelle_negate_elimination'] },
			trigger: { kind: 'attacked', picks: [/Not Today/] },
			expect: { mp: { 'own.0': 5 }, energy: 1, state: [['players.player_1.welloePile.length', 0], ['players.player_1.activeSlots.0.sideways', true]] } },
	] },
	{ snelle: 'snelle_sleutelpuntje', deck: 'example', cases: [
		{ name: 'before the Quest roll: +1 die (Jeffrey 3 dice would fail [5,2,2]; 4 dice [5,2,2,5] win a Skilled Quest)',
			setup: { field: [{ id: 'mosje_jeffrey', mp: 20 }], oppField: OPP40, hand: ['snelle_sleutelpuntje'], quest: ARM, abilityDice: [5, 2, 2, 5] },
			trigger: { kind: 'quest', stack: 'FIGHTING', picks: [/Arm Wrestling/, /Sleutelpuntje/] }, expect: { mp: { 'own.0': 70 }, energy: 2, handDelta: -1 } }, // 20 + 40 + Jeffrey Brute Force 10
	] },
	{ snelle: 'snelle_lucky_coin', deck: 'example', cases: [
		{ name: 'Creative 2: reroll one chosen die once ([5,2] -> [5,6] wins Arm Wrestling)',
			setup: { field: [{ id: 'mosje_gandoe_wizard', mp: 20 }], oppField: OPP40, hand: ['snelle_lucky_coin'], quest: ARM, dice: [5, 2], abilityDice: [6] },
			trigger: { kind: 'quest', stack: 'FIGHTING', picks: [/Arm Wrestling/, /Lucky/, /Die 2/, /Done/] }, expect: { mp: { 'own.0': 60 }, energy: 2, handDelta: -1 } },
		{ name: 'Creative 3: choose the result (Quick Thinking [2,2,2] -> die 1 set to 6 wins)',
			setup: { field: [{ id: 'mosje_ronald_mastermind', mp: 20 }], oppField: OPP40, hand: ['snelle_lucky_coin'], quest: QUICK, dice: [2, 2, 2] },
			trigger: { kind: 'quest', stack: 'DIGITAL', picks: [/Quick Thinking/, /Lucky/, /Die 1/, /^6$/, /Done/] }, expect: { mp: { 'own.0': 45 }, energy: 2, handDelta: -1 } },
		{ name: 'Needs Creative: no Creative Mosje -> not offered, nothing paid',
			setup: { field: [{ id: MICHELLE, mp: 20 }], oppField: OPP40, hand: ['snelle_lucky_coin'], quest: ARM, dice: [5, 5], abilityDice: [2] },
			trigger: { kind: 'quest', stack: 'FIGHTING' }, expect: { energy: 3, handDelta: 0 } },
	] },
	{ snelle: 'snelle_jeweetniet', deck: 'example', cases: [
		{ name: 'opponent rolls [5,5,5] (win), reroll all -> [1,1,1] fails: -15 instead of +25',
			setup: { field: [{ id: MING, mp: 20 }], oppField: [{ id: 'mosje_ronald_mastermind', mp: 40 }], hand: ['snelle_jeweetniet'], quest: QUICK, abilityDice: [5, 5, 5, 1, 1, 1] },
			trigger: { kind: 'botQuest', stack: 'DIGITAL', picks: [/Je Weet Niet/] }, expect: { mp: { 'opp.0': 25 }, energy: 2, handDelta: -1 } },
	] },
];
