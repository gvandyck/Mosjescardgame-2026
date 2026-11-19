/**
 * place-registry-2-0.js - card-test-library entries for the Power Places (Obby 2.0, Phase 60-04, EFX-04 part 1).
 * Numbers come from the Card List Place table (docs/obby-2.0), not from engine output.
 * Driver: tests/helpers/mosjeCardTest.js (the spec passes { mosje: place } as the entry id); trigger 'none' reads the board as laid out.
 * Mosjes: Bulldozer (Physical, L1 Power 20), Ming Natural (Digital, 10), Tuk Healer (Creative, 0, a Tuk), Michelle (Physical 10),
 * Gandoe Destroyer (Physical 20).
 */
const BULL = 'mosje_alyssa_bulldozer';
const DIG = 'mosje_ming_natural'; // Creative since 71 (used only where the type does not matter)
const DIGP = 'mosje_ming_predictor'; // Digital, Power 10 (Gym / Arcade / Skiffa Digital rows)
const MICH = 'mosje_michelle';
const ARM = { stack: 'PHYSICAL', id: 'quest_arm_wrestling' }; // Michelle rolls 2 Str dice, needs 2x 5+
const HACK = { stack: 'DIGITAL', id: 'quest_hack_mainframe' }; // Skilled, two 4+ on the Tech dice, +40 / -30
const MELK = 'piecie_kannetje_melk';
const ART = 'mosje_tuk_healer';
const GANDOE = 'mosje_gandoe_destroyer';
const OPP = [{ id: 'mosje_ming_predictor', mp: 40 }];
const NONE = { kind: 'none' };
const at = (place, id, extra = {}) => ({ field: [{ id, mp: 50, ...extra.f }], oppField: OPP, place: { id: place, by: 'player_2' }, ...extra.s });
const power = (name, place, id, n, extra) => ({ name, setup: at(place, id, extra), trigger: NONE, expect: { power: { 'own.0': n } } });
const fresh = (place, id, n) => ({ name: 'a fresh Mosje ignores it', setup: at(place, id, { f: { fresh: true } }), trigger: NONE, expect: { power: { 'own.0': n } } });

const strQuest = (place, name, mp, after) => ({ name, setup: { field: [{ id: MICH, mp }], oppField: OPP, place: { id: place, by: 'player_2' }, quest: ARM, dice: [5, 2, 5] }, trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/] }, expect: { mp: { 'own.0': after } } });
const turn = (place, name, id, mp, after, f = {}) => ({ name, setup: { field: [{ id, mp, ...f }], oppField: OPP, place: { id: place, by: 'player_2' } }, trigger: { kind: 'turnStart' }, expect: { mp: { 'own.0': after } } });
const quest = (place, name, dice, after) => ({ name, setup: { field: [{ id: DIG, mp: 40 }], oppField: OPP, place: { id: place, by: 'player_2' }, quest: { stack: 'DIGITAL', id: 'quest_quick_thinking' }, dice }, trigger: { kind: 'quest', stack: 'DIGITAL' }, expect: { mp: { 'own.0': after } } });

const PLACE_ENTRIES = [
	{ place: 'place_the_gym', deck: 'example', cases: [
		power('Physical Power 20 -> 30', 'place_the_gym', BULL, 30),
		power('Digital Power 10 stays 10', 'place_the_gym', DIGP, 10),
		fresh('place_the_gym', BULL, 20),
		strQuest('place_the_gym', 'a Str Quest rolls 1 die more (Michelle 2 dice [5,2] would fail; 3 dice [5,2,5] win +40: 20 -> 60)', 20, 60),
		{ name: 'an attack by a Physical Power 20 Mosje takes 30 MP',
			setup: { field: [{ id: ART, mp: 50 }], oppField: [{ id: BULL, mp: 40 }], place: { id: 'place_the_gym', by: 'player_2' } },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 20 } } },
	] },
	{ place: 'place_de_box', deck: 'example', cases: [
		power('a Michelle +10 -> 20', 'place_de_box', 'mosje_michelle', 20),
		power('a Tuk +10 -> 10', 'place_de_box', ART, 10),
		power('a Gandoe +10 -> 30', 'place_de_box', GANDOE, 30),
		power('anyone else +0', 'place_de_box', BULL, 20),
		fresh('place_de_box', 'mosje_michelle', 10),
		power('a DJ 80/20 (Power 5) +10 -> 15', 'place_de_box', 'mosje_dj_8020', 15),
		strQuest('place_de_box', 'a Michelle rolls 1 die more on a Str Quest (3 dice [5,2,5] win: 20 -> 60)', 20, 60),
		{ name: 'anyone else gets no die: Bulldozer (2 dice [5,2]) fails, 50 -> 20', setup: { field: [{ id: BULL, mp: 50 }], oppField: OPP, place: { id: 'place_de_box', by: 'player_2' }, quest: ARM, dice: [5, 2, 5] }, trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/] }, expect: { mp: { 'own.0': 20 } } },
	] },
	{ place: 'place_arcade', deck: 'example', cases: [
		power('Physical Power 20 -> 10', 'place_arcade', BULL, 10),
		power('Digital Power 10 stays 10', 'place_arcade', DIGP, 10),
		fresh('place_arcade', BULL, 20),
	] },
	{ place: 'place_skiffa', deck: 'example', cases: [
		power('Digital Power 10 -> 0', 'place_skiffa', DIGP, 0),
		power('Physical Power 20 stays 20', 'place_skiffa', BULL, 20),
		fresh('place_skiffa', DIGP, 10),
	] },
	{ place: 'place_bank_chilling', deck: 'example', cases: [
		power('every Mosje -10: Physical 20 -> 10', 'place_bank_chilling', BULL, 10),
		power('Power 0 never goes below 0', 'place_bank_chilling', ART, 0),
		fresh('place_bank_chilling', BULL, 20),
	] },
	{ place: 'place_dierenasiel', deck: 'rest', cases: [
		power('no staying pet Piecie: -10 (20 -> 10)', 'place_dierenasiel', BULL, 10),
		power('a staying pet Piecie: no change', 'place_dierenasiel', BULL, 20, { s: { piecies: [{ slot: 0, id: 'piecie_vianna_poes', faceDown: false, stays: 'endOfNextTurn' }] } }),
		fresh('place_dierenasiel', BULL, 20),
	] },
	// Phase 60-05 (EFX-04 part 2): turn-start, dice and Quest-MP Places. Fresh Mosjes are laid out with fresh:true.
	{ place: 'place_the_gym', deck: 'example', part: 'turn start', cases: [
		turn('place_the_gym', 'no MP loss at turn start any more: a Digital Mosje stays at 40', DIGP, 40, 40),
		turn('place_the_gym', 'a Physical Mosje is unchanged (40)', BULL, 40, 40),
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
		name: 'an Creative Mosje may reroll 1 die on its Quest roll (1,1 fails; reroll die 1 -> 6 wins +25)',
		setup: { field: [{ id: ART, mp: 50 }], oppField: OPP, place: { id: 'place_skiffa', by: 'player_2' }, quest: { stack: 'CREATIVE', id: 'quest_inspire_crowd' }, dice: [1, 1], abilityDice: [6] },
		trigger: { kind: 'quest', stack: 'CREATIVE', picks: [/Reroll die 1/] }, expect: { mp: { 'own.0': 75 } },
	}] },
	{ place: 'place_tesla', deck: 'example', part: 'play', cases: [
		{ name: 'cannot be played without a Coert on your field',
			setup: { field: [{ id: DIG, mp: 40 }], oppField: OPP, hand: ['place_tesla'] },
			trigger: { kind: 'playFromHand', cardId: 'place_tesla' }, expect: { energy: 3, handDelta: 0, state: [['activePlace', null]] } },
		{ name: 'can be played with a Coert on your field (3 Energy)',
			setup: { field: [{ id: 'mosje_coert_kasteluck', mp: 40 }], oppField: OPP, hand: ['place_tesla'] },
			trigger: { kind: 'playFromHand', cardId: 'place_tesla' }, expect: { energy: 0, handDelta: -1, state: [['activePlace', 'place_tesla']] } },
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
		{ name: 'Bijna Welloe (a Snelle that gains MP; Emergency Healings is Oh nee toch niet now) gives 0 and is still played',
			setup: { field: [{ id: ART, mp: 5 }], oppField: OPP, place: { id: 'place_the_void', by: 'player_2' }, hand: ['snelle_bijna_welloe'] },
			trigger: { kind: 'playSnelle', cardId: 'snelle_bijna_welloe' }, expect: { mp: { 'own.0': 5 }, energy: 3, handDelta: -1 } },
	] },
	{ place: 'place_coerts_caravan', deck: 'rest', part: 'free Piecie', cases: [
		{ name: 'with a Coert the first Piecie costs 0 Energy (3 stays 3)',
			setup: { field: [{ id: 'mosje_coert_kasteluck', mp: 40 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_broodje_doner' }], place: { id: 'place_coerts_caravan', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_broodje_doner' }, expect: { energy: 3 } },
		{ name: 'only the first: with a Coert the second Piecie of the turn costs full price (Doner free, Chefs Special 1: 3 -> 2)',
			setup: { field: [{ id: 'mosje_coert_kasteluck', mp: 40 }], oppField: OPP, piecies: [{ slot: 0, id: 'piecie_broodje_doner' }, { slot: 1, id: 'piecie_chefs_special' }], place: { id: 'place_coerts_caravan', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: 'piecie_broodje_doner', then: { kind: 'activatePiecie', cardId: 'piecie_chefs_special' } }, expect: { energy: 2 } },
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
	// -- 71-23: the five new starter Places (Ronnie's Kitchen, Woonkamer (Discord), Youri's Woonkamer, Nieuwe Gimma, Punto Banco). Michelle rolls 2 Str dice on Arm Wrestling (needs 2x 5+). --
	{ place: 'place_ronnies_kitchen', deck: 'starter', cases: [
		{ name: 'a food Piecie gives 10 MP more (Kannetje Melk 25 -> 35: 20 -> 55), no draw without a Ronald',
			setup: { field: [{ id: MICH, mp: 20 }], oppField: OPP, piecies: [{ slot: 0, id: MELK }], place: { id: 'place_ronnies_kitchen', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: MELK }, expect: { mp: { 'own.0': 55 }, handDelta: 0 } },
		{ name: 'with a Ronald: the first food Piecie of the turn also draws 1',
			setup: { field: [{ id: 'mosje_ronald_mastermind', mp: 20 }], oppField: OPP, piecies: [{ slot: 0, id: MELK }], place: { id: 'place_ronnies_kitchen', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: MELK }, expect: { mp: { 'own.0': 55 }, handDelta: 1 } },
		{ name: 'with a Ronald: the second food Piecie of the turn draws nothing (5 + 35 + 35 = 75, 1 card drawn)',
			setup: { field: [{ id: 'mosje_ronald_mastermind', mp: 5 }], oppField: OPP, piecies: [{ slot: 0, id: MELK }, { slot: 1, id: MELK }], place: { id: 'place_ronnies_kitchen', by: 'player_2' }, energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: MELK, then: { kind: 'activatePiecie', cardId: MELK } }, expect: { mp: { 'own.0': 75 }, handDelta: 1 } },
	] },
	{ place: 'place_woonkamer_discord', deck: 'starter', cases: [
		{ name: 'two Digital Mosjes: +1 die on a Tech Quest (Hack Mainframe, Ming 2 dice [4,1] would fail; 3 dice [4,1,5] win +40: 20 -> 60)',
			setup: { field: [{ slot: 0, id: DIGP, mp: 20 }, { slot: 1, id: DIGP, mp: 40 }], oppField: OPP, place: { id: 'place_woonkamer_discord', by: 'player_2' }, quest: HACK, dice: [4, 1, 5] },
			trigger: { kind: 'quest', stack: 'DIGITAL', picks: [/Hack Mainframe/] }, expect: { mp: { 'own.0': 60 } } },
		{ name: 'one Digital Mosje: no extra die, the same roll [4,1] fails (-30: 40 -> 10)',
			setup: { field: [{ slot: 0, id: DIGP, mp: 40 }], oppField: OPP, place: { id: 'place_woonkamer_discord', by: 'player_2' }, quest: HACK, dice: [4, 1, 5] },
			trigger: { kind: 'quest', stack: 'DIGITAL', picks: [/Hack Mainframe/] }, expect: { mp: { 'own.0': 10 } } },
	] },
	{ place: 'place_youris_woonkamer', deck: 'starter', cases: [
		{ name: 'with a Youri: a Piecie activated on the turn it was placed draws 1 (played 1, Youri level 1 draws none, Place draws 1)',
			setup: { field: [{ id: 'mosje_youri', mp: 30 }], oppField: OPP, energy: 3, hand: [MELK], noUnlock: true, place: { id: 'place_youris_woonkamer', by: 'player_2' } },
			trigger: { kind: 'playFromHand', cardId: MELK, then: { kind: 'button', mosje: 'mosje_youri', picks: [/./], then: { kind: 'activatePiecie', cardId: MELK } } },
			expect: { mp: { 'own.0': 55 }, energy: 2, handDelta: 0 } },
		{ name: 'a Piecie placed on an earlier turn draws nothing (ready Melk, 30 -> 55, hand unchanged)',
			setup: { field: [{ id: 'mosje_youri', mp: 30 }], oppField: OPP, energy: 3, piecies: [{ slot: 0, id: MELK }], place: { id: 'place_youris_woonkamer', by: 'player_2' } },
			trigger: { kind: 'activatePiecie', cardId: MELK }, expect: { mp: { 'own.0': 55 }, handDelta: 0 } },
	] },
	{ place: 'place_nieuwe_gimma', deck: 'starter', cases: [
		{ name: 'the first roll of the turn has 1 die more (Michelle 2 dice [5,2] would fail; 3 dice [5,2,5] win: 20 -> 60)',
			setup: { field: [{ id: MICH, mp: 20 }], oppField: OPP, place: { id: 'place_nieuwe_gimma', by: 'player_2' }, quest: ARM, dice: [5, 2, 5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/] }, expect: { mp: { 'own.0': 60 } } },
		{ name: 'the second roll of the turn does not: slot 1 rolls 2 dice [5,2] and fails (-30: 40 -> 10)',
			setup: { field: [{ slot: 0, id: MICH, mp: 20 }, { slot: 1, id: MICH, mp: 40 }], oppField: OPP, place: { id: 'place_nieuwe_gimma', by: 'player_2' }, quest: ARM, dice: [5, 2, 5, 5, 2] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/], then: { kind: 'setQuestFaceUp', stack: 'PHYSICAL', questId: 'quest_arm_wrestling', then: { kind: 'quest', slot: 1, stack: 'PHYSICAL', picks: [/Arm Wrestling/] } } },
			expect: { mp: { 'own.0': 60, 'own.1': 10 } } },
	] },
	{ place: 'place_punto_banco', deck: 'starter', cases: [
		{ name: 'call Punto, Punto 5 > Banco 2: 1 Energy paid and +2 dice (Michelle rolls 4: [2,2,5,5] win, 20 -> 60)',
			setup: { field: [{ id: MICH, mp: 20 }], oppField: OPP, place: { id: 'place_punto_banco', by: 'player_2' }, quest: ARM, dice: [5, 2, 2, 2, 5, 5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/, /Call Punto/] }, expect: { mp: { 'own.0': 60 }, energy: 2 } },
		{ name: 'a tie gives the Energy back and no dice: Punto 4 = Banco 4, Michelle rolls [5,2] and fails (40 -> 10)',
			setup: { field: [{ id: MICH, mp: 40 }], oppField: OPP, place: { id: 'place_punto_banco', by: 'player_2' }, quest: ARM, dice: [4, 4, 5, 2, 5, 5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/, /Call Punto/] }, expect: { mp: { 'own.0': 10 }, energy: 3 } },
		{ name: '"No" changes nothing: no Energy paid, Michelle rolls 2 dice [5,5] and wins (20 -> 60)',
			setup: { field: [{ id: MICH, mp: 20 }], oppField: OPP, place: { id: 'place_punto_banco', by: 'player_2' }, quest: ARM, dice: [5, 5, 2, 2] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/Arm Wrestling/, /^No$/] }, expect: { mp: { 'own.0': 60 }, energy: 3 } },
	] },
];

// Example Deck Places first (stable sort keeps each group in file order).
export const PLACE_REGISTRY = [...PLACE_ENTRIES].sort((a, b) => (a.deck === 'example' ? 0 : 1) - (b.deck === 'example' ? 0 : 1));
