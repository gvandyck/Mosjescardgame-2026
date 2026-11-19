/**
 * snelle-registry-2-0.js - card-test-library entries for the Obby 2.0 Snelle (Phase 60).
 * Every expected number comes from the Card List Snelle table (docs/obby-2.0), not from engine output.
 * Driver: tests/helpers/mosjeCardTest.js (the spec passes { mosje: snelle } as the entry id). Energy starts at 3.
 * Plain Mosjes: Ming Predictor (no stars that matter), Michelle (Strength 2). Opponent hand is pinned empty (no windows).
 * Trigger kinds: playSnelle (own hand, through the UI), botPlaySnelle / botQuest (the bot acts, for the reaction cards).
 */
import { previewAttack } from '../../../src/engine/attack/previewAttack.js';

const MING = 'mosje_ming_predictor';
const MICHELLE = 'mosje_michelle';
const OPP40 = [{ id: MING, mp: 40 }];
const ATTACKER = [{ id: 'mosje_jeffrey', mp: 50, level: 3 }]; // 30 Power, non-fresh
const ARM = { stack: 'PHYSICAL', id: 'quest_arm_wrestling' };
const QUICK = { stack: 'DIGITAL', id: 'quest_quick_thinking' };
const BANK = { id: 'place_bank_chilling', by: 'player_2' };
const AFFOE = 'piecie_affoe'; // 1 star: the opponent Mosje loses 15 MP, one of the activator's Mosjes gains 10
const MILK = 'piecie_kannetje_melk'; // 0 Energy, one of your Mosjes gains 25
const YOURI = 'mosje_youri'; // Mental 1 (a 1-die roller for Oh nee toch niet)
const MENTAL2 = 'mosje_cless_teacher'; // Mental 2 (Counter Strikka / Jammertje 'Needs'); Jisca lost Mental in the 9 Nov trait curve
const TUK = 'mosje_tuk_healer'; // a Creative Mosje (Lucky Coin 'Needs')
const VARK = 'piecie_varkenspootjes'; // targets: true. Jensen! / Counter Strikka react to a targeting Piecie only (71-16)
const attackLanded = (before, after) => { if (!(after.players.player_1.activeSlots[0].mp < 80)) throw new Error('the attack did not land'); };
const inBotDiscard = (id) => (before, after) => {
	if (!after.players.player_2.graveyard.some(c => c.cardId === id)) throw new Error(`${id} is not in the bot's discard pile`);
};

export const SNELLE_REGISTRY = [
	{ snelle: 'snelle_momentum_rush', deck: 'example', cases: [ // Aansteker
		{ name: 'Aansteker: the bot attacks, the attacker loses 15 MP (50 -> 35), then the attack lands, for 0 Energy',
			setup: { field: [{ id: MING, mp: 80 }], oppField: ATTACKER, hand: ['snelle_momentum_rush'] },
			trigger: { kind: 'attacked', picks: [/Aansteker/] },
			expect: { mp: { 'opp.0': 35 }, energy: 3, handDelta: -1, check: attackLanded } },
		{ name: 'not played: the attacker keeps its MP and the attack lands',
			setup: { field: [{ id: MING, mp: 80 }], oppField: ATTACKER },
			trigger: { kind: 'attacked' }, expect: { mp: { 'opp.0': 50 }, check: attackLanded } },
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
		{ name: 'draw 1 card for 2 Energy (the card itself leaves the hand)',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_ff_haaltje_nemen'] },
			trigger: { kind: 'playSnelle', cardId: 'snelle_ff_haaltje_nemen' }, expect: { energy: 1, handDelta: 0 } },
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
	{ snelle: 'snelle_emergency_healings', deck: 'example', cases: [ // Oh nee toch niet
		{ name: 'Oh nee toch niet: the bot starts a Quest and rolls 1 die less ([1,1,5] would win +25; 2 dice [1,1] fail -15: 40 -> 25)',
			setup: { field: [{ id: MING, mp: 40 }], oppField: [{ id: MING, mp: 40 }], hand: ['snelle_emergency_healings'], quest: QUICK, abilityDice: [1, 1, 5] },
			trigger: { kind: 'botQuest', stack: 'DIGITAL', picks: [/Oh nee/] }, expect: { mp: { 'opp.0': 25 }, energy: 2, handDelta: -1 } },
		{ name: 'not played: the same roll [1,1,5] with 3 dice wins +25 (40 -> 65)',
			setup: { field: [{ id: MING, mp: 40 }], oppField: [{ id: MING, mp: 40 }], hand: ['snelle_emergency_healings'], quest: QUICK, abilityDice: [1, 1, 5] },
			trigger: { kind: 'botQuest', stack: 'DIGITAL', picks: [/No reaction|Pass/i] }, expect: { mp: { 'opp.0': 65 }, energy: 3, handDelta: 0 } },
		{ name: 'a 1-die roll stays 1 die: Youri (Mental 1) rolls [5] and still wins +25 (40 -> 65)',
			setup: { field: [{ id: MING, mp: 40 }], oppField: [{ id: YOURI, mp: 40 }], hand: ['snelle_emergency_healings'], quest: QUICK, abilityDice: [5] },
			trigger: { kind: 'botQuest', stack: 'DIGITAL', picks: [/Oh nee/] }, expect: { mp: { 'opp.0': 65 }, energy: 2, handDelta: -1 } },
	] },
	{ snelle: 'snelle_the_protector', deck: 'example', cases: [
		// Phase 70 numbers: the held attack is Power + type triangle - Resilient; The Protector takes 30 off that loss.
		{ name: 'attacked: loses 30 less than the attack preview says, for 0 Energy',
			setup: { field: [{ id: MING, mp: 80 }], oppField: ATTACKER, hand: ['snelle_the_protector'] },
			trigger: { kind: 'attacked', picks: [/The Protector/] },
			expect: { energy: 3, handDelta: -1,
				check: (b, a) => { const full = previewAttack(b, 'player_2', 0, 'player_1', 0).final; const want = 80 - Math.max(0, full - 30); const got = a.players.player_1.activeSlots[0].mp; if (got !== want) throw new Error('Protector: expected ' + want + ' MP (attack ' + full + '), got ' + got); } } },
	] },
	{ snelle: 'snelle_negate_elimination', deck: 'example', cases: [
		{ name: 'sideways Mosje taksed to the Welloe pile: stays sideways at 5 MP, Welloe pile empty',
			setup: { field: [{ id: MING, mp: 5, sideways: true }], oppField: ATTACKER, hand: ['snelle_negate_elimination'] },
			trigger: { kind: 'attacked', picks: [/Not Today/] },
			expect: { mp: { 'own.0': 5 }, energy: 1, state: [['players.player_1.welloePile.length', 0], ['players.player_1.activeSlots.0.sideways', true]] } },
	] },
	{ snelle: 'snelle_sleutelpuntje', deck: 'example', cases: [
		{ name: 'before the Quest roll: +1 die (Michelle 2 dice [5,2] would fail Arm Wrestling; 3 dice [5,2,5] win +40: 20 -> 60)',
			setup: { field: [{ id: MICHELLE, mp: 20 }], oppField: OPP40, hand: ['snelle_sleutelpuntje'], quest: ARM, dice: [5, 2, 5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/, /Sleutelpuntje/] }, expect: { mp: { 'own.0': 60 }, energy: 2, handDelta: -1 } },
		{ name: 'not played: 2 dice [5,2] fail, -30 (40 -> 10)',
			setup: { field: [{ id: MICHELLE, mp: 40 }], oppField: OPP40, hand: ['snelle_sleutelpuntje'], quest: ARM, dice: [5, 2, 5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/, /No reaction|Pass/i] }, expect: { mp: { 'own.0': 10 }, energy: 3, handDelta: 0 } },
	] },
	{ snelle: 'snelle_lucky_coin', deck: 'example', cases: [
		{ name: 'with a Creative Mosje: reroll the 2 of [5,2] -> 5 and Michelle wins Arm Wrestling (20 -> 60)',
			setup: { field: [{ slot: 0, id: MICHELLE, mp: 20 }, { slot: 1, id: TUK, mp: 20 }], oppField: OPP40, hand: ['snelle_lucky_coin'], quest: ARM, dice: [5, 2], abilityDice: [5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/, /Lucky/, /Die 2/, /Done/] }, expect: { mp: { 'own.0': 60 }, energy: 2, handDelta: -1 } },
		{ name: 'any of the dice: both dice of [2,2] are rerolled to [5,5] and win (20 -> 60)',
			setup: { field: [{ slot: 0, id: MICHELLE, mp: 20 }, { slot: 1, id: TUK, mp: 20 }], oppField: OPP40, hand: ['snelle_lucky_coin'], quest: ARM, dice: [2, 2], abilityDice: [5, 5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/, /Lucky/, /Die 1/, /Die 2/] }, expect: { mp: { 'own.0': 60 }, energy: 2, handDelta: -1 } },
		{ name: 'Needs a Creative Mosje: none on the field -> not offered, nothing paid (the roll [5,5] wins as it is)',
			setup: { field: [{ id: MICHELLE, mp: 20 }], oppField: OPP40, hand: ['snelle_lucky_coin'], quest: ARM, dice: [5, 5], abilityDice: [2] },
			trigger: { kind: 'quest', stack: 'PHYSICAL' }, expect: { mp: { 'own.0': 60 }, energy: 3, handDelta: 0 } },
	] },
	{ snelle: 'snelle_jeweetniet', deck: 'example', cases: [
		{ name: 'opponent rolls [5,5,5] (win), reroll all -> [1,1,1] fails: -15 instead of +25',
			setup: { field: [{ id: MING, mp: 20 }], oppField: [{ id: MING, mp: 40 }], hand: ['snelle_jeweetniet'], quest: QUICK, abilityDice: [5, 5, 5, 1, 1, 1] },
			trigger: { kind: 'botQuest', stack: 'DIGITAL', picks: [/Je Weet Niet/] }, expect: { mp: { 'opp.0': 25 }, energy: 2, handDelta: -1 } },
	] },
	// -- 60-03: cancel / redirect / copy Snelle. The bot activates Affoe (the human's Mosje -15, the bot's own +10); the human answers. --
	{ snelle: 'snelle_jensen', deck: 'example', cases: [
		{ name: 'Varkenspootjes (targets) on my Mosje is cancelled: no loss, the card in the bot discard pile, its Energy stays spent',
			setup: { field: [{ id: MING, mp: 40 }], oppField: OPP40, hand: ['snelle_jensen'] },
			trigger: { kind: 'botActivatePiecie', cardId: VARK, picks: [/Jensen/] },
			expect: { mp: { 'own.0': 40, 'opp.0': 40 }, energy: 2, handDelta: -1, state: [['players.player_2.energy', 5]], check: inBotDiscard(VARK) } },
		{ name: 'Kleine Taks (targets) on my Mosje is cancelled too: no tick, the card in the bot discard pile',
			setup: { field: [{ id: MING, mp: 40 }], oppField: OPP40, hand: ['snelle_jensen'] },
			trigger: { kind: 'botActivatePiecie', cardId: 'piecie_kleine_taks', picks: [/Jensen/] },
			expect: { mp: { 'own.0': 40 }, energy: 2, handDelta: -1, check: inBotDiscard('piecie_kleine_taks') } },
		{ name: 'a Piecie that does not target (Kannetje Melk) is not answered: no window, it resolves',
			setup: { field: [{ id: MING, mp: 40 }], oppField: OPP40, hand: ['snelle_jensen'] },
			trigger: { kind: 'botActivatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 40 }, energy: 3, handDelta: 0 } },
	] },
	{ snelle: 'snelle_jammertje_gepakt', deck: 'example', cases: [
		{ name: 'Mental 2: the Piecie goes to the bottom of the bot deck, no effect, no draw',
			setup: { field: [{ id: MENTAL2, mp: 40 }], oppField: OPP40, hand: ['snelle_jammertje_gepakt'] },
			trigger: { kind: 'botActivatePiecie', cardId: AFFOE, picks: [/Jammertje/] },
			expect: { mp: { 'own.0': 40, 'opp.0': 40 }, energy: 1, handDelta: -1,
				check: (b, a) => { const d = a.players.player_2.deck; if (d[d.length - 1]?.cardId !== AFFOE) throw new Error('Affoe is not the bottom card of the bot deck'); } } },
		{ name: 'Mental 3 (Ming) also draws... the Piecie is cancelled: same, the Piecie is cancelled, Snelle paid',
			setup: { field: [{ id: MING, mp: 40 }], oppField: OPP40, hand: ['snelle_jammertje_gepakt'] },
			trigger: { kind: 'botActivatePiecie', cardId: AFFOE, picks: [/Jammertje/] }, expect: { mp: { 'own.0': 40 }, energy: 1, handDelta: 0 } },
		{ name: 'Needs Mental: no such Mosje -> not offered, Affoe resolves',
			setup: { field: [{ id: MICHELLE, mp: 40 }], oppField: OPP40, hand: ['snelle_jammertje_gepakt'] },
			trigger: { kind: 'botActivatePiecie', cardId: AFFOE }, expect: { mp: { 'own.0': 25, 'opp.0': 50 }, energy: 3, handDelta: 0 } },
	] },
	{ snelle: 'snelle_counter_strikka', deck: 'example', cases: [
		{ name: 'Varkenspootjes aimed at slot 0 hits the other Mosje instead (slot 1: -15)',
			setup: { field: [{ slot: 0, id: MENTAL2, mp: 40 }, { slot: 1, id: MICHELLE, mp: 40 }], oppField: OPP40, hand: ['snelle_counter_strikka'] },
			trigger: { kind: 'botActivatePiecie', cardId: VARK, targets: { any_target: { playerId: 'player_1', slotIndex: 0 } }, picks: [/Counter Strikka/, /Michelle/] },
			expect: { mp: { 'own.0': 40, 'own.1': 25, 'opp.0': 40 }, energy: 1, handDelta: -1 } },
	] },
	{ snelle: 'snelle_dubbele_temminks', deck: 'example', cases: [
		{ name: 'my Kannetje Melk (+25) happens twice: 20 -> 70',
			setup: { field: [{ id: MING, mp: 20 }], oppField: OPP40, hand: ['snelle_dubbele_temminks'], piecies: [{ slot: 0, id: MILK }] },
			trigger: { kind: 'activatePiecie', cardId: MILK, picks: [/Dubbele/] }, expect: { mp: { 'own.0': 70 }, energy: 1, handDelta: -1 } },
		{ name: 'not on a five-star Piecie (Klaar Met Jou): not offered, only Klaar Met Jou resolves',
			setup: { field: [{ id: MING, mp: 40, level: 2 }], oppField: [{ id: MING, mp: 30 }], hand: ['snelle_dubbele_temminks'], energy: 6, piecies: [{ slot: 0, id: 'piecie_klaar_met_jou' }] },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_klaar_met_jou' },
			expect: { energy: 2, handDelta: 1, state: [['players.player_2.welloePile.length', 1]] } }, // 4 Energy; the draw of Klaar Met Jou; Dubbele Temminks stays in hand
	] },
	{ snelle: 'snelle_gevalletje_klakkeloos', deck: 'example', cases: [
		{ name: 'bot Affoe hits me (-15), I get the same effect with my own targets (+10 me, -15 bot)',
			setup: { field: [{ id: MING, mp: 40 }], oppField: OPP40, hand: ['snelle_gevalletje_klakkeloos'] },
			trigger: { kind: 'botActivatePiecie', cardId: AFFOE, picks: [/Gevalletje/] },
			expect: { mp: { 'own.0': 35, 'opp.0': 35 }, energy: 1, handDelta: -1, state: [['players.player_1.pieciesActivatedThisTurn', 0]] } },
	] },
	{ snelle: 'snelle_frenssen', deck: 'example', cases: [
		// Phase 61: the bot plays Jensen! only to save a Mosje in danger (getemt, Level 3, a loss of 20+), so the bot Mosje is Level 3.
		{ name: 'my Varkenspootjes on the bot Mosje: the bot Jensen! is cancelled, Varkenspootjes resolves and a bot Mosje also loses 10 (70 - 10 - 15)',
			setup: { field: [{ id: MICHELLE, mp: 20 }], oppField: [{ id: MING, mp: 70, level: 3 }], hand: ['snelle_frenssen'], oppHand: ['snelle_jensen'], energy: 6, piecies: [{ slot: 0, id: VARK }] },
			trigger: { kind: 'activatePiecie', cardId: VARK, picks: [/Ming/, /Frenssen/] },
			expect: { mp: { 'own.0': 20, 'opp.0': 45 }, level: { 'opp.0': 3 }, energy: 3, handDelta: -1, state: [['players.player_2.energy', 5]] } },
	] },
	{ snelle: 'snelle_blensen', deck: 'example', cases: [
		{ name: 'costs 4 without a Jensen!/Frenssen!; afterwards the bot Affoe cannot target my Mosje',
			setup: { field: [{ id: MING, mp: 40 }], oppField: OPP40, hand: ['snelle_blensen'], energy: 6 },
			trigger: { kind: 'playSnelle', cardId: 'snelle_blensen', then: { kind: 'botActivatePiecie', cardId: AFFOE } },
			expect: { mp: { 'own.0': 40, 'opp.0': 40 }, energy: 2, handDelta: -1, state: [['blensenShield.playerId', 'player_1']] } },
	] },
	// -- 71-23: Chris's Handdoek (starter, after the Example Deck cards). Michelle (2 dice) rolls Arm Wrestling; the Handdoek rerolls 1 die after the roll. --
	{ snelle: 'snelle_chriss_handdoek', deck: 'starter', cases: [
		{ name: 'after my roll [5,2]: reroll die 2 -> 5 and Michelle wins (20 -> 60); a Chris on the field also gains 10 (20 -> 30)',
			setup: { field: [{ slot: 0, id: MICHELLE, mp: 20 }, { slot: 1, id: 'mosje_chris_ddr', mp: 20 }], oppField: OPP40, hand: ['snelle_chriss_handdoek'], quest: ARM, dice: [5, 2], abilityDice: [5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/, /Handdoek/, /Die 2/] }, expect: { mp: { 'own.0': 60, 'own.1': 30 }, energy: 3, handDelta: -1 } },
		{ name: 'no Chris on the field: the die is rerolled (win, 20 -> 60) and nobody gains the 10 MP',
			setup: { field: [{ id: MICHELLE, mp: 20 }], oppField: OPP40, hand: ['snelle_chriss_handdoek'], quest: ARM, dice: [5, 2], abilityDice: [5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/, /Handdoek/, /Die 2/] }, expect: { mp: { 'own.0': 60 }, energy: 3, handDelta: -1 } },
	] },
];
