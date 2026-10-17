/**
 * quest-registry-2-0.js - card-test-library entries for the 38 Obby 2.0 Quests (Phase 60-08, TEST-02).
 * Every expected number comes from the Card List Quest tables (docs/obby-2.0), not from engine output.
 * Driver: tests/helpers/mosjeCardTest.js (the spec passes { mosje: quest } as the entry id); the Quest is driven through the real
 * Quest picker (#btn-quest): slot, stack, cost / die picks, result screen, jab. Dice are forced with setNextDice.
 * Quest bands: Steady one 4+ (+25/-15) · Skilled two 4+ (+40/-30) · Heroic two 5+ (+60/-25) · Prepared pay first then one 4+ (+50/-30)
 *              Gated condition then one 4+ (+35/-20) · Coin flip 1 die 4+ (+50/-25) · Trained no roll (+25, can't fail).
 * Dice = 1 per star of the rolled trait (min 1, max 4). Test Mosjes (Card List level-1 rows, no Quest-related ability):
 *   Gandoe, The Destroyer: Phys 3, Res 2, no other trait (1 die on Mental / Technical / Creative / Social).  Level-1 Power 20.
 *   Ming, The Predictor: Men 3, Tech 2.   Binti, The Sharp Tongue: Cre 2, Soc 3.   Ronald, The Master Chef: Phys 1.
 * Example Deck Quests (named in the deck notes) come first.
 */
import { all, replaced, tokenOne, discarded, slotEmpty, noAttempt, untouched, deckTopIs, deckShorterBy } from '../../helpers/questCheckKit.js';

const GD = 'mosje_gandoe_destroyer', MING = 'mosje_ming_predictor', BINTI = 'mosje_binti', CHEF = 'mosje_ronald_chef';
const WEST = 'mosje_martin_senor_west', MASTERMIND = 'mosje_ronald_mastermind', BULL = 'mosje_alyssa_bulldozer';
const YOURI = 'mosje_youri', COERT = 'mosje_coert_tech', CLESS = 'mosje_cless_teacher';
const MILK = 'piecie_kannetje_melk', DONER = 'piecie_broodje_doner', STRAFFOE = 'piecie_straffoe', AFFOE = 'piecie_affoe';
const LARRY = 'piecie_larry_zegeltje', SNOEI = 'piecie_snoeiertje', KEYBOARD = 'piecie_keyboard', MOUSE = 'piecie_mouse';
const FF = 'snelle_ff_haaltje_nemen';
const OPP40 = [{ id: MING, mp: 40 }];
const F = 'FIGHTING', D = 'DIGITAL', A = 'ARTISTIC';
const WIN = [6, 6, 6], LOSE = [1, 1, 1];

const S = (who, mp, stack, id, over = {}) => ({ field: [{ id: who, mp }], oppField: OPP40, quest: { stack, id }, ...over });
const go = (stack, ids = [], more = {}) => ({ kind: 'quest', stack, ids, ...more });
const refused = (stack) => ({ kind: 'questRefused', stack });
const won = (stack, id, more) => all(replaced(stack, id), more);
const lost = (stack, id, more) => all(tokenOne(stack, id), more);
const piecies = (...ids) => ids.map((id, slot) => ({ slot, id }));
// A "no attempt" case: the gate is shut, so nothing is paid and nothing changes.
const gate = (name, setup, stack) => ({ name, setup, trigger: refused(stack), expect: { check: untouched(stack) } });

export const QUEST_REGISTRY = [
	// ---- Example Deck Quests ----
	{ quest: 'quest_endurance_test', deck: 'example', cases: [
		{ name: 'discard a food Piecie from your hand, win: +50',
			setup: S(GD, 20, F, 'quest_endurance_test', { dice: WIN, hand: [MILK] }), trigger: go(F),
			expect: { mp: { 'own.0': 70 }, handDelta: -1, check: won(F, 'quest_endurance_test', discarded(MILK)) } },
		{ name: 'a ready food Piecie pays too',
			setup: S(GD, 20, F, 'quest_endurance_test', { dice: WIN, piecies: piecies(DONER) }), trigger: go(F),
			expect: { mp: { 'own.0': 70 }, check: won(F, 'quest_endurance_test', all(discarded(DONER), slotEmpty(0))) } },
		{ name: 'fail: -30 and the food is not refunded',
			setup: S(GD, 40, F, 'quest_endurance_test', { dice: LOSE, hand: [MILK] }), trigger: go(F),
			expect: { mp: { 'own.0': 10 }, handDelta: -1, check: lost(F, 'quest_endurance_test', discarded(MILK)) } },
		gate('a substance is not food: no attempt, nothing paid', S(GD, 20, F, 'quest_endurance_test', { dice: WIN, hand: [STRAFFOE] }), F),
	] },
	{ quest: 'quest_dutch_courage', deck: 'example', cases: [
		{ name: 'discard a substance Piecie, win: +50 and a jab (-10 on an opponent Mosje)',
			setup: S(GD, 20, F, 'quest_dutch_courage', { dice: WIN, hand: [STRAFFOE] }), trigger: go(F),
			expect: { mp: { 'own.0': 70, 'opp.0': 30 }, handDelta: -1, check: won(F, 'quest_dutch_courage', discarded(STRAFFOE)) } },
		{ name: 'fail: -30, no jab, the substance is gone',
			setup: S(GD, 40, F, 'quest_dutch_courage', { dice: LOSE, hand: [STRAFFOE] }), trigger: go(F),
			expect: { mp: { 'own.0': 10, 'opp.0': 40 }, check: lost(F, 'quest_dutch_courage', discarded(STRAFFOE)) } },
		gate('food is not a substance: no attempt', S(GD, 20, F, 'quest_dutch_courage', { dice: WIN, hand: [MILK] }), F),
	] },
	{ quest: 'quest_master_plan', deck: 'example', cases: [
		{ name: '3 face-down Piecies: Gated, win +35',
			setup: S(MING, 20, D, 'quest_master_plan', { dice: WIN, piecies: piecies(MILK, STRAFFOE, AFFOE) }), trigger: go(D),
			expect: { mp: { 'own.0': 55 }, check: won(D, 'quest_master_plan') } },
		{ name: 'fail: -20',
			setup: S(MING, 40, D, 'quest_master_plan', { dice: LOSE, piecies: piecies(MILK, STRAFFOE, AFFOE) }), trigger: go(D),
			expect: { mp: { 'own.0': 20 }, check: lost(D, 'quest_master_plan') } },
		gate('only 2 face-down (the 3rd is face-up): no attempt',
			S(MING, 20, D, 'quest_master_plan', { dice: WIN, piecies: [...piecies(MILK, STRAFFOE), { slot: 2, id: AFFOE, faceDown: false }] }), D),
	] },
	{ quest: 'quest_cheat_code', deck: 'example', cases: [
		{ name: 'discard a Snelle from your hand, win: +50 and draw 1 card',
			setup: S(MING, 20, D, 'quest_cheat_code', { dice: WIN, hand: [FF] }), trigger: go(D),
			expect: { mp: { 'own.0': 70 }, handDelta: 0, check: won(D, 'quest_cheat_code', all(discarded(FF), deckShorterBy(1))) } },
		{ name: 'fail: -30, no draw, the Snelle is gone',
			setup: S(MING, 40, D, 'quest_cheat_code', { dice: LOSE, hand: [FF] }), trigger: go(D),
			expect: { mp: { 'own.0': 10 }, handDelta: -1, check: lost(D, 'quest_cheat_code', all(discarded(FF), deckShorterBy(0))) } },
		gate('no Snelle in hand (a Piecie does not count): no attempt', S(MING, 20, D, 'quest_cheat_code', { dice: WIN, hand: [MILK] }), D),
	] },
	{ quest: 'quest_regelaar', deck: 'example', cases: [
		{ name: '1 Piecie vs 0: Gated, win +35 and a jab',
			setup: S(MING, 20, D, 'quest_regelaar', { dice: WIN, piecies: piecies(MILK) }), trigger: go(D),
			expect: { mp: { 'own.0': 55, 'opp.0': 30 }, check: won(D, 'quest_regelaar') } },
		gate('1 Piecie each is not more: no attempt',
			S(MING, 20, D, 'quest_regelaar', { dice: WIN, piecies: piecies(MILK), oppPiecies: piecies(MILK) }), D),
		gate('no Piecies on either side: no attempt', S(MING, 20, D, 'quest_regelaar', { dice: WIN }), D),
	] },
	{ quest: 'quest_larry_temmen', deck: 'example', cases: [
		{ name: 'discard Larry / Zegeltje, win: +50 and the win also jabs',
			setup: S(BINTI, 20, A, 'quest_larry_temmen', { dice: WIN, hand: [LARRY] }), trigger: go(A),
			expect: { mp: { 'own.0': 70, 'opp.0': 30 }, check: won(A, 'quest_larry_temmen', discarded(LARRY)) } },
		{ name: 'discard another substance: +50 but no jab',
			setup: S(BINTI, 20, A, 'quest_larry_temmen', { dice: WIN, hand: [STRAFFOE] }), trigger: go(A),
			expect: { mp: { 'own.0': 70, 'opp.0': 40 }, check: won(A, 'quest_larry_temmen', discarded(STRAFFOE)) } },
		gate('no substance in hand: no attempt', S(BINTI, 20, A, 'quest_larry_temmen', { dice: WIN, hand: [MILK] }), A),
	] },

	// ---- Fighting stack ----
	{ quest: 'quest_arm_wrestling', deck: 'rest', cases: [
		{ name: 'Skilled: two 4+ on Physical, win +40',
			setup: S(GD, 20, F, 'quest_arm_wrestling', { dice: WIN }), trigger: go(F), expect: { mp: { 'own.0': 60 }, check: won(F, 'quest_arm_wrestling') } },
		{ name: 'only one 4+ is a fail: -30 and a token',
			setup: S(GD, 40, F, 'quest_arm_wrestling', { dice: [6, 3, 3] }), trigger: go(F),
			expect: { mp: { 'own.0': 10 }, check: lost(F, 'quest_arm_wrestling') } },
	] },
	{ quest: 'quest_sprint_race', deck: 'rest', cases: [
		{ name: 'Trained (Physical 2 stars or more): no roll, +25 even with failing dice',
			setup: S(GD, 20, F, 'quest_sprint_race', { dice: LOSE }), trigger: go(F, ['ok']),
			expect: { mp: { 'own.0': 45 }, check: won(F, 'quest_sprint_race') } },
		gate('Physical 1 star (Ronald, The Master Chef): no attempt', S(CHEF, 20, F, 'quest_sprint_race', { dice: WIN }), F),
	] },
	{ quest: 'quest_sustained_assault', deck: 'rest', cases: [
		{ name: 'another Mosje attacked this turn: +1 die turns a 1 die roll [1,6] into a win, +25 and a jab',
			setup: { field: [{ slot: 0, id: CHEF, mp: 20 }, { slot: 1, id: GD, mp: 30 }], oppField: [{ id: MING, mp: 60 }], quest: { stack: F, id: 'quest_sustained_assault' }, dice: [1, 6] },
			trigger: { kind: 'attack', slot: 1, target: 'player_2:0', then: go(F) },
			expect: { mp: { 'own.0': 45, 'opp.0': 30 }, check: won(F, 'quest_sustained_assault') } }, // attack -20 (Power 20), jab -10
		{ name: 'nobody attacked: 1 die, [1,6] is a fail, -15',
			setup: S(CHEF, 40, F, 'quest_sustained_assault', { dice: [1, 6] }), trigger: go(F),
			expect: { mp: { 'own.0': 25, 'opp.0': 40 }, check: lost(F, 'quest_sustained_assault') } },
	] },
	{ quest: 'quest_tough_it_out', deck: 'rest', cases: [
		{ name: 'Steady: one 4+ on Resilient, win +25',
			setup: S(GD, 20, F, 'quest_tough_it_out', { dice: [1, 4] }), trigger: go(F), expect: { mp: { 'own.0': 45 }, check: won(F, 'quest_tough_it_out') } },
	] },
	{ quest: 'quest_survive_storm', deck: 'rest', cases: [
		{ name: '30 MP or less: +1 die, [1,6] wins, +25',
			setup: S(MING, 30, F, 'quest_survive_storm', { dice: [1, 6] }), trigger: go(F), expect: { mp: { 'own.0': 55 }, check: won(F, 'quest_survive_storm') } },
		{ name: '35 MP: no extra die, [1,6] fails, -15',
			setup: S(MING, 35, F, 'quest_survive_storm', { dice: [1, 6] }), trigger: go(F), expect: { mp: { 'own.0': 20 }, check: lost(F, 'quest_survive_storm') } },
	] },
	{ quest: 'quest_never_give_up', deck: 'rest', cases: [
		{ name: 'Level 1 Mosje: Skilled win +40',
			setup: S(GD, 20, F, 'quest_never_give_up', { dice: WIN }), trigger: go(F), expect: { mp: { 'own.0': 60 }, check: won(F, 'quest_never_give_up') } },
		gate('Level 2 Mosje: no attempt', { field: [{ id: GD, mp: 20, level: 2 }], oppField: OPP40, quest: { stack: F, id: 'quest_never_give_up' }, dice: WIN }, F),
	] },
	{ quest: 'quest_parkour_challenge', deck: 'rest', cases: [
		{ name: 'discard a ready Piecie, win: +50',
			setup: S(GD, 20, F, 'quest_parkour_challenge', { dice: WIN, piecies: piecies(MILK) }), trigger: go(F),
			expect: { mp: { 'own.0': 70 }, check: won(F, 'quest_parkour_challenge', all(discarded(MILK), slotEmpty(0))) } },
		{ name: 'fail: -30 and the Piecie is not refunded',
			setup: S(GD, 40, F, 'quest_parkour_challenge', { dice: LOSE, piecies: piecies(MILK) }), trigger: go(F),
			expect: { mp: { 'own.0': 10 }, check: lost(F, 'quest_parkour_challenge', all(discarded(MILK), slotEmpty(0))) } },
		gate('a Piecie placed this turn is not ready: no attempt', S(GD, 20, F, 'quest_parkour_challenge', { dice: WIN, piecies: piecies(MILK), noUnlock: true }), F),
	] },
	{ quest: 'quest_endure_pain', deck: 'rest', cases: [
		{ name: 'a Piecie of yours stays in play: Gated, win +35',
			setup: S(GD, 20, F, 'quest_endure_pain', { dice: WIN, piecies: [{ slot: 0, id: 'piecie_vianna_poes', faceDown: false, stays: 'endOfNextTurn' }] }), trigger: go(F),
			expect: { mp: { 'own.0': 55 }, check: won(F, 'quest_endure_pain') } },
		gate('no Piecie stays in play: no attempt', S(GD, 20, F, 'quest_endure_pain', { dice: WIN, piecies: piecies(MILK) }), F),
	] },
	{ quest: 'quest_momentum_master', deck: 'rest', cases: [
		{ name: '80 MP: Gated, win +35 reaches 100 and levels up (Level 2, MP 0)',
			setup: S(GD, 80, F, 'quest_momentum_master', { dice: WIN }), trigger: go(F),
			expect: { mp: { 'own.0': 0 }, level: { 'own.0': 2 }, check: won(F, 'quest_momentum_master') } },
		gate('75 MP: no attempt', S(GD, 75, F, 'quest_momentum_master', { dice: WIN }), F),
	] },
	{ quest: 'quest_ultimate_challenge', deck: 'rest', cases: [
		{ name: 'a Place is in play: Heroic (two 5+ on the best trait), win +60',
			setup: S(GD, 20, F, 'quest_ultimate_challenge', { dice: WIN, place: { id: 'place_the_void', by: 'player_2' } }), trigger: go(F),
			expect: { mp: { 'own.0': 80 }, check: won(F, 'quest_ultimate_challenge') } },
		{ name: 'fail: -25',
			setup: S(GD, 40, F, 'quest_ultimate_challenge', { dice: LOSE, place: { id: 'place_the_void', by: 'player_2' } }), trigger: go(F),
			expect: { mp: { 'own.0': 15 }, check: lost(F, 'quest_ultimate_challenge') } },
		gate('no Place in play: no attempt', S(GD, 20, F, 'quest_ultimate_challenge', { dice: WIN }), F),
	] },
	{ quest: 'quest_geen_raad_vraag_aad', deck: 'rest', cases: [
		{ name: 'Coin flip: a 4 wins, +50',
			setup: S(BULL, 20, F, 'quest_geen_raad_vraag_aad', { dice: [4] }), trigger: go(F), expect: { mp: { 'own.0': 70 }, check: won(F, 'quest_geen_raad_vraag_aad') } },
		{ name: 'a Gandoe gains 10 more on a win: +60',
			setup: S(GD, 20, F, 'quest_geen_raad_vraag_aad', { dice: [6] }), trigger: go(F), expect: { mp: { 'own.0': 80 }, check: won(F, 'quest_geen_raad_vraag_aad') } },
		{ name: 'a 3 fails: -25 (empty hand, nothing to discard)',
			setup: S(BULL, 40, F, 'quest_geen_raad_vraag_aad', { dice: [3] }), trigger: go(F), expect: { mp: { 'own.0': 15 }, check: lost(F, 'quest_geen_raad_vraag_aad') } },
		{ name: 'Vraag Aad: fail and discard 1 card, lose only 10',
			setup: S(BULL, 40, F, 'quest_geen_raad_vraag_aad', { dice: [3], hand: [MILK] }), trigger: go(F),
			expect: { mp: { 'own.0': 30 }, handDelta: -1, check: lost(F, 'quest_geen_raad_vraag_aad', discarded(MILK)) } },
		{ name: 'Vraag Aad declined: lose the full 25, keep the card',
			setup: S(BULL, 40, F, 'quest_geen_raad_vraag_aad', { dice: [3], hand: [MILK] }), trigger: go(F, ['ok', 'no']),
			expect: { mp: { 'own.0': 15 }, handDelta: 0, check: lost(F, 'quest_geen_raad_vraag_aad') } },
	] },

	// ---- Digital stack ----
	{ quest: 'quest_debug_system', deck: 'rest', cases: [
		{ name: 'Trained (Technical 2 stars): +25, then put the top 5 cards of a deck back in any order',
			setup: S(MING, 20, D, 'quest_debug_system', { deckTop: [MILK, DONER, STRAFFOE, AFFOE, LARRY] }),
			trigger: go(D, ['ok', 'player_1', '4', '3', '2', '1', '0']),
			expect: { mp: { 'own.0': 45 }, check: won(D, 'quest_debug_system', deckTopIs([LARRY, AFFOE, STRAFFOE, DONER, MILK])) } },
		gate('Technical 1 star (Martin, Senor West): no attempt', S(WEST, 20, D, 'quest_debug_system', { dice: WIN }), D),
	] },
	{ quest: 'quest_quick_thinking', deck: 'rest', cases: [
		{ name: 'Steady: a single 4 among [1,1,4] wins, +25',
			setup: S(MING, 20, D, 'quest_quick_thinking', { dice: [1, 1, 4] }), trigger: go(D), expect: { mp: { 'own.0': 45 }, check: won(D, 'quest_quick_thinking') } },
		{ name: 'no 4+ fails: -15 and a token',
			setup: S(MING, 40, D, 'quest_quick_thinking', { dice: [3, 3, 3] }), trigger: go(D), expect: { mp: { 'own.0': 25 }, check: lost(D, 'quest_quick_thinking') } },
	] },
	{ quest: 'quest_calculate_odds', deck: 'rest', cases: [
		{ name: '3 revealed cards of one type (Piecies): +1 die, [1,6] wins, +25; the cards go back in order',
			setup: S(GD, 20, D, 'quest_calculate_odds', { dice: [1, 6], deckTop: [MILK, AFFOE, STRAFFOE] }), trigger: go(D),
			expect: { mp: { 'own.0': 45 }, check: won(D, 'quest_calculate_odds', deckTopIs([MILK, AFFOE, STRAFFOE])) } },
		{ name: '2 of the 3 share a type (Piecie, Snelle, Piecie): +1 die, wins',
			setup: S(GD, 20, D, 'quest_calculate_odds', { dice: [1, 6], deckTop: [MILK, 'snelle_jensen', AFFOE] }), trigger: go(D),
			expect: { mp: { 'own.0': 45 }, check: won(D, 'quest_calculate_odds') } },
		{ name: 'Piecie, Snelle, Place (all different): no extra die, [1,6] fails, -15',
			setup: S(GD, 40, D, 'quest_calculate_odds', { dice: [1, 6], deckTop: [MILK, 'snelle_jensen', 'place_the_gym'] }), trigger: go(D),
			expect: { mp: { 'own.0': 25 }, check: lost(D, 'quest_calculate_odds', deckTopIs([MILK, 'snelle_jensen', 'place_the_gym'])) } },
	] },
	{ quest: 'quest_late_night_questing', deck: 'rest', cases: [
		{ name: '2 gear Piecies in your discard pile: +1 die, [1,6] wins, +25 and a jab on a non-Digital Mosje',
			setup: S(GD, 20, D, 'quest_late_night_questing', { dice: [1, 6], graveyard: [KEYBOARD, MOUSE], oppField: [{ id: BULL, mp: 60 }] }), trigger: go(D),
			expect: { mp: { 'own.0': 45, 'opp.0': 50 }, check: won(D, 'quest_late_night_questing') } },
		{ name: 'only 1 gear Piecie: no extra die, [1,6] fails, -15',
			setup: S(GD, 40, D, 'quest_late_night_questing', { dice: [1, 6], graveyard: [KEYBOARD] }), trigger: go(D),
			expect: { mp: { 'own.0': 25 }, check: lost(D, 'quest_late_night_questing') } },
		{ name: 'win, but the only opponent Mosje is Digital: no jab',
			setup: S(GD, 20, D, 'quest_late_night_questing', { dice: WIN }), trigger: go(D),
			expect: { mp: { 'own.0': 45, 'opp.0': 40 }, check: won(D, 'quest_late_night_questing') } },
	] },
	{ quest: 'quest_hack_mainframe', deck: 'rest', cases: [
		{ name: 'Skilled: [4,4] are two 4+ on Technical, win +40',
			setup: S(MING, 20, D, 'quest_hack_mainframe', { dice: [4, 4] }), trigger: go(D), expect: { mp: { 'own.0': 60 }, check: won(D, 'quest_hack_mainframe') } },
		{ name: 'one 4 and one 3 is a fail: -30',
			setup: S(MING, 40, D, 'quest_hack_mainframe', { dice: [4, 3] }), trigger: go(D), expect: { mp: { 'own.0': 10 }, check: lost(D, 'quest_hack_mainframe') } },
	] },
	{ quest: 'quest_strategy_puzzle', deck: 'rest', cases: [
		{ name: 'discard 1 hand card: +1 die, [6,6] are two 4+, win +40',
			setup: S(GD, 20, D, 'quest_strategy_puzzle', { dice: [6, 6], hand: [MILK] }), trigger: go(D),
			expect: { mp: { 'own.0': 60 }, handDelta: -1, check: won(D, 'quest_strategy_puzzle', discarded(MILK)) } },
		{ name: 'no discard: 1 die, only one 4+, fail -30, the card stays',
			setup: S(GD, 40, D, 'quest_strategy_puzzle', { dice: [6, 6], hand: [MILK] }), trigger: go(D, ['no']),
			expect: { mp: { 'own.0': 10 }, handDelta: 0, check: lost(D, 'quest_strategy_puzzle') } },
	] },
	{ quest: 'quest_synergy_mastery', deck: 'rest', cases: [
		{ name: 'used this Mosje\'s ability this turn: Heroic (two 5+ on Technical), win +60',
			setup: S(MING, 20, D, 'quest_synergy_mastery', { dice: [6, 6], energy: 3, pendingTargets: { stack_id: F, bottom: false } }),
			trigger: { kind: 'button', mosje: MING, then: go(D) }, expect: { mp: { 'own.0': 80 }, check: won(D, 'quest_synergy_mastery') } },
		gate('ability not used yet: no attempt', S(MING, 20, D, 'quest_synergy_mastery', { dice: [6, 6] }), D),
	] },
	{ quest: 'quest_build_gadget', deck: 'rest', cases: [
		{ name: 'activated 1 ready Piecie this turn (Kannetje Melk +25), then win +50',
			setup: S(MING, 10, D, 'quest_build_gadget', { dice: WIN, piecies: piecies(MILK) }),
			trigger: { kind: 'activatePiecie', cardId: MILK, then: go(D) }, expect: { mp: { 'own.0': 85 }, check: won(D, 'quest_build_gadget') } },
		gate('no Piecie activated yet: no attempt', S(MING, 10, D, 'quest_build_gadget', { dice: WIN, piecies: piecies(MILK) }), D),
	] },
	{ quest: 'quest_speed_run', deck: 'rest', cases: [
		{ name: 'activated 2 ready Piecies; Youri gains 10 more: 5 + 25 (Kannetje) + 50 + 10',
			setup: S(YOURI, 5, D, 'quest_speed_run', { dice: WIN, piecies: piecies(MILK, SNOEI) }),
			trigger: { kind: 'activatePiecie', cardId: MILK, then: { kind: 'activatePiecie', cardId: SNOEI, then: go(D) } },
			expect: { mp: { 'own.0': 90 }, check: won(D, 'quest_speed_run') } },
		{ name: 'anyone else: no bonus, 5 + 25 + 50',
			setup: S(MING, 5, D, 'quest_speed_run', { dice: WIN, piecies: piecies(MILK, SNOEI) }),
			trigger: { kind: 'activatePiecie', cardId: MILK, then: { kind: 'activatePiecie', cardId: SNOEI, then: go(D) } },
			expect: { mp: { 'own.0': 80 }, check: won(D, 'quest_speed_run') } },
		{ name: 'only 1 Piecie activated: no attempt',
			setup: S(MING, 5, D, 'quest_speed_run', { dice: WIN, piecies: piecies(MILK, SNOEI) }),
			trigger: { kind: 'activatePiecie', cardId: MILK, then: refused(D) }, expect: { mp: { 'own.0': 30 }, check: noAttempt(D) } },
	] },
	{ quest: 'quest_perfect_timing', deck: 'rest', cases: [
		{ name: '70 MP: Coin flip, a 4 wins +50 and reaches 100 (Level 2, MP 0)',
			setup: S(MING, 70, D, 'quest_perfect_timing', { dice: [4] }), trigger: go(D),
			expect: { mp: { 'own.0': 0 }, level: { 'own.0': 2 }, check: won(D, 'quest_perfect_timing') } },
		{ name: '80 MP is still in range (70 to 80)',
			setup: S(MING, 80, D, 'quest_perfect_timing', { dice: [4] }), trigger: go(D),
			expect: { mp: { 'own.0': 0 }, level: { 'own.0': 2 }, check: won(D, 'quest_perfect_timing') } },
		gate('65 MP: no attempt', S(MING, 65, D, 'quest_perfect_timing', { dice: [4] }), D),
		gate('85 MP: no attempt', S(MING, 85, D, 'quest_perfect_timing', { dice: [4] }), D),
	] },

	// ---- Artistic stack ----
	{ quest: 'quest_team_building', deck: 'rest', cases: [
		{ name: 'Trained (Social 2 stars or more): no roll, +25',
			setup: S(BINTI, 20, A, 'quest_team_building', { dice: LOSE }), trigger: go(A, ['ok']), expect: { mp: { 'own.0': 45 }, check: won(A, 'quest_team_building') } },
		gate('no Social at all (Ronald, The Mastermind): no attempt', S(MASTERMIND, 20, A, 'quest_team_building', { dice: WIN }), A),
	] },
	{ quest: 'quest_artistic_expression', deck: 'rest', cases: [
		{ name: 'drew 2+ cards this turn (Ff Haaltje Nemen): +1 die, [1,6] wins, +25',
			setup: S(GD, 20, A, 'quest_artistic_expression', { dice: [1, 6], hand: [FF] }),
			trigger: { kind: 'playSnelle', cardId: FF, then: go(A) }, expect: { mp: { 'own.0': 45 }, energy: 1, check: won(A, 'quest_artistic_expression') } },
		{ name: 'no extra draw: 1 die, [1,6] fails, -15',
			setup: S(GD, 40, A, 'quest_artistic_expression', { dice: [1, 6] }), trigger: go(A), expect: { mp: { 'own.0': 25 }, check: lost(A, 'quest_artistic_expression') } },
	] },
	{ quest: 'quest_inspire_crowd', deck: 'rest', cases: [
		{ name: 'Steady: one 4+ on Social, win +25',
			setup: S(BINTI, 20, A, 'quest_inspire_crowd', { dice: [1, 1, 5] }), trigger: go(A), expect: { mp: { 'own.0': 45 }, check: won(A, 'quest_inspire_crowd') } },
	] },
	{ quest: 'quest_improvise', deck: 'rest', cases: [
		{ name: 'pay 1 Energy: +1 die, [1,6] wins, +25',
			setup: S(GD, 20, A, 'quest_improvise', { dice: [1, 6] }), trigger: go(A),
			expect: { mp: { 'own.0': 45 }, energy: 2, check: won(A, 'quest_improvise') } },
		{ name: 'decline: 1 die, [1,6] fails, -15, Energy kept',
			setup: S(GD, 40, A, 'quest_improvise', { dice: [1, 6] }), trigger: go(A, ['no']),
			expect: { mp: { 'own.0': 25 }, energy: 3, check: lost(A, 'quest_improvise') } },
	] },
	{ quest: 'quest_form_alliance', deck: 'rest', cases: [
		{ name: 'Skilled win +40; one opponent Mosje also gains 10',
			setup: S(BINTI, 20, A, 'quest_form_alliance', { dice: WIN }), trigger: go(A),
			expect: { mp: { 'own.0': 60, 'opp.0': 50 }, check: won(A, 'quest_form_alliance') } },
		{ name: 'fail: -30, the opponent gains nothing',
			setup: S(BINTI, 40, A, 'quest_form_alliance', { dice: LOSE }), trigger: go(A),
			expect: { mp: { 'own.0': 10, 'opp.0': 40 }, check: lost(A, 'quest_form_alliance') } },
	] },
	{ quest: 'quest_lucky_break', deck: 'rest', cases: [
		{ name: 'Heroic: [6,6] are two 5+ on Creative, win +60',
			setup: S(BINTI, 20, A, 'quest_lucky_break', { dice: [6, 6] }), trigger: go(A), expect: { mp: { 'own.0': 80 }, check: won(A, 'quest_lucky_break') } },
		{ name: 'a 6 and a 4 is only one 5+: fail -25',
			setup: S(BINTI, 40, A, 'quest_lucky_break', { dice: [6, 4] }), trigger: go(A), expect: { mp: { 'own.0': 15 }, check: lost(A, 'quest_lucky_break') } },
	] },
	{ quest: 'quest_negotiation', deck: 'rest', cases: [
		{ name: 'discard a Piecie from your hand, win: +50',
			setup: S(BINTI, 20, A, 'quest_negotiation', { dice: WIN, hand: [MILK] }), trigger: go(A),
			expect: { mp: { 'own.0': 70 }, handDelta: -1, check: won(A, 'quest_negotiation', discarded(MILK)) } },
		gate('only a Snelle in hand: no attempt', S(BINTI, 20, A, 'quest_negotiation', { dice: WIN, hand: [FF] }), A),
	] },
	{ quest: 'quest_parkeren_delft', deck: 'rest', cases: [
		{ name: 'discard a ready Piecie, win +50; up to 3 cards in discard piles leave the game',
			setup: S(MASTERMIND, 20, A, 'quest_parkeren_delft', { dice: WIN, piecies: piecies(MILK), graveyard: [AFFOE, STRAFFOE, DONER] }), trigger: go(A),
			expect: { mp: { 'own.0': 70 }, check: won(A, 'quest_parkeren_delft', (b, a) => {
				if ((a.removedFromGame || []).length !== 3) throw new Error(`removed ${(a.removedFromGame || []).length} cards, expected 3`);
				if (a.players.player_1.graveyard.length !== 1) throw new Error(`discard pile has ${a.players.player_1.graveyard.length} cards, expected 1 (3 + the paid Piecie - 3)`);
			}) } },
		{ name: 'a Coert gains 10 more on a win: 20 + 50 + 10',
			setup: S(COERT, 20, A, 'quest_parkeren_delft', { dice: [6], piecies: piecies(MILK) }), trigger: go(A),
			expect: { mp: { 'own.0': 80 }, check: won(A, 'quest_parkeren_delft') } },
		{ name: 'a Cless loses 10 more on a failure: 50 - 30 - 10',
			setup: S(CLESS, 50, A, 'quest_parkeren_delft', { dice: LOSE, piecies: piecies(MILK) }), trigger: go(A),
			expect: { mp: { 'own.0': 10 }, check: lost(A, 'quest_parkeren_delft', discarded(MILK)) } },
		gate('no ready Piecie: no attempt', S(MASTERMIND, 20, A, 'quest_parkeren_delft', { dice: WIN }), A),
	] },
	{ quest: 'quest_create_masterpiece', deck: 'rest', cases: [
		{ name: '3 Piecies in play: Gated, win +35',
			setup: S(BINTI, 20, A, 'quest_create_masterpiece', { dice: [6, 6], piecies: piecies(MILK, STRAFFOE, AFFOE) }), trigger: go(A),
			expect: { mp: { 'own.0': 55 }, check: won(A, 'quest_create_masterpiece') } },
		gate('only 2 Piecies in play: no attempt', S(BINTI, 20, A, 'quest_create_masterpiece', { dice: [6, 6], piecies: piecies(MILK, STRAFFOE) }), A),
	] },
	{ quest: 'quest_shotje_obby', deck: 'rest', cases: [
		{ name: 'your total MP (20) is lower than theirs (100): win +35, the jab hits their highest-MP Mosje (60 -> 50)',
			setup: S(BINTI, 20, A, 'quest_shotje_obby', { dice: WIN, oppField: [{ id: MING, mp: 40 }, { id: BULL, mp: 60, slot: 1 }] }), trigger: go(A),
			expect: { mp: { 'own.0': 55, 'opp.0': 40, 'opp.1': 50 }, check: won(A, 'quest_shotje_obby') } },
		gate('equal total MP (40 vs 40) is not lower: no attempt', S(BINTI, 40, A, 'quest_shotje_obby', { dice: WIN }), A),
	] },
	{ quest: 'quest_leap_of_faith', deck: 'rest', cases: [
		{ name: 'Coin flip: a 4 wins, +50',
			setup: S(BINTI, 20, A, 'quest_leap_of_faith', { dice: [4] }), trigger: go(A), expect: { mp: { 'own.0': 70 }, check: won(A, 'quest_leap_of_faith') } },
		{ name: 'a 3 fails: -25',
			setup: S(BINTI, 40, A, 'quest_leap_of_faith', { dice: [3] }), trigger: go(A), expect: { mp: { 'own.0': 15 }, check: lost(A, 'quest_leap_of_faith') } },
	] },
];
