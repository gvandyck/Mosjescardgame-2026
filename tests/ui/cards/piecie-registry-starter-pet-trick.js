/**
 * piecie-registry-starter-pet-trick.js - card-test-library rows for the starter pet and trick Piecies (Phase 71-21, D-35 b).
 * Every expected number comes from the 2.1 card text in docs/obby-2.0/handover/card-list.md and rules.md section 13, not from engine output.
 * Ming Predictor: Power 10, no Strength, no passive (1 die on a Strength Quest). Michelle: Strength 2 (2 dice), a Michelle.
 * An attacker is the opponent Ming with powerBoost 20 (Power 30), hitting own slot 0 through the bot-attack hook.
 */
const MING = 'mosje_ming_predictor';
const OPP40 = [{ id: MING, mp: 40 }];
const HIT30 = [{ id: MING, mp: 40, powerBoost: 20 }];
const on = (id, slot = 0) => [{ slot, id }];
const own = (id, mp = 20) => [{ id, mp }];
const act = (cardId, extra = {}) => ({ kind: 'activatePiecie', cardId, ...extra });
const ARM = { stack: 'PHYSICAL', id: 'quest_arm_wrestling' }; // Skilled: two 4+ on Strength, +40 on a win, -30 on a fail
const roll = (slot = 0) => ({ kind: 'quest', stack: 'PHYSICAL', slot, ids: [] });
const hitOn = (id, mp, piecie, energy = 3) => ({
	setup: { field: own(id, mp), oppField: HIT30, piecies: on(piecie), energy },
	trigger: act(piecie, { then: { kind: 'attacked' } }),
});

export const STARTER_PET_TRICK_ROWS = [
	// -- Pets ---------------------------------------------------------------
	{ piecie: 'piecie_bowie_stormey', deck: 'starter', section: 'Pet', cases: [
		{ name: 'a Mosje that is not named loses 10 less: a 30 hit takes 20 (1 Energy)', ...hitOn(MING, 40, 'piecie_bowie_stormey'), expect: { mp: { 'own.0': 20 }, energy: 2 } },
		{ name: 'not named: Larry roll 1-2 costs 25, 10 less is 15 lost',
			setup: { field: own(MING, 40), oppField: OPP40, energy: 6, piecies: [{ slot: 0, id: 'piecie_bowie_stormey' }, { slot: 1, id: 'piecie_larry_zegeltje' }], abilityDice: [2] },
			trigger: act('piecie_bowie_stormey', { then: act('piecie_larry_zegeltje') }), expect: { mp: { 'own.0': 25 } } },
		{ name: 'mosje_michelle: 20 less, a 25 MP loss is only 5',
			setup: { field: own('mosje_michelle', 40), oppField: OPP40, energy: 6, piecies: [{ slot: 0, id: 'piecie_bowie_stormey' }, { slot: 1, id: 'piecie_larry_zegeltje' }], abilityDice: [2] },
			trigger: act('piecie_bowie_stormey', { then: act('piecie_larry_zegeltje') }), expect: { mp: { 'own.0': 35 } } },
		{ name: 'mosje_gandoe_wizard: 20 less, a 25 MP loss is only 5',
			setup: { field: own('mosje_gandoe_wizard', 40), oppField: OPP40, energy: 6, piecies: [{ slot: 0, id: 'piecie_bowie_stormey' }, { slot: 1, id: 'piecie_larry_zegeltje' }], abilityDice: [2] },
			trigger: act('piecie_bowie_stormey', { then: act('piecie_larry_zegeltje') }), expect: { mp: { 'own.0': 35 } } },
		{ name: 'mosje_tuk_healer: 20 less, a 25 MP loss is only 5',
			setup: { field: own('mosje_tuk_healer', 40), oppField: OPP40, energy: 6, piecies: [{ slot: 0, id: 'piecie_bowie_stormey' }, { slot: 1, id: 'piecie_larry_zegeltje' }], abilityDice: [2] },
			trigger: act('piecie_bowie_stormey', { then: act('piecie_larry_zegeltje') }), expect: { mp: { 'own.0': 35 } } },
		{ name: 'the card stays on the table (until the end of your next turn)',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_bowie_stormey') }, trigger: act('piecie_bowie_stormey'),
			expect: { state: [['players.player_1.piecieSlots.0.stays', true]] } },
	] },
	// -- Tricks: protection --------------------------------------------------
	{ piecie: 'piecie_afblijven', deck: 'starter', section: 'Utility', cases: [
		{ name: "during the opponent's turn the chosen Mosje loses 20 less: a 30 hit takes 10 (1 Energy)", ...hitOn(MING, 40, 'piecie_afblijven'), expect: { mp: { 'own.0': 30 }, energy: 2 } },
		{ name: "on your own turn it does nothing: a 15 MP loss of your own Mosje is the full 15",
			setup: { field: own(MING, 40), oppField: OPP40, energy: 6, piecies: [{ slot: 0, id: 'piecie_afblijven' }, { slot: 1, id: 'piecie_grammetje_pieter' }], abilityDice: [2] },
			trigger: act('piecie_afblijven', { then: act('piecie_grammetje_pieter') }), expect: { mp: { 'own.0': 25 } } },
	] },
	{ piecie: 'piecie_momentum_boost', deck: 'starter', section: 'Utility', cases: [
		{ name: 'Ctrl+S (0 Energy): a Level 2 Mosje attacked to 0 MP stays Level 2 at 0 MP',
			setup: { field: [{ id: MING, mp: 10, level: 2 }], oppField: OPP40, piecies: on('piecie_momentum_boost') },
			trigger: act('piecie_momentum_boost', { then: { kind: 'attacked' } }), expect: { mp: { 'own.0': 0 }, level: { 'own.0': 2 }, energy: 3 } },
		{ name: 'without Ctrl+S the same hit drops the Level 2 Mosje a level',
			setup: { field: [{ id: MING, mp: 10, level: 2 }], oppField: OPP40 }, trigger: { kind: 'attacked' }, expect: { level: { 'own.0': 1 } } },
	] },
	// -- Tricks: draw, look and move cards ----------------------------------
	{ piecie: 'piecie_energy_surge', deck: 'starter', section: 'Utility', cases: [
		{ name: 'Kladje activated: draw 1 (0 Energy)',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_energy_surge') }, trigger: act('piecie_energy_surge'), expect: { handDelta: 1, energy: 3 } },
	] },
	{ piecie: 'piecie_bagga_of_greed', deck: 'starter', section: 'Utility', cases: [
		{ name: 'draw 2, then discard 1 (a plain card): 2 drawn, 1 discarded',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_bagga_of_greed'), hand: ['piecie_affoe'] },
			trigger: act('piecie_bagga_of_greed', { picks: [/Affoe/] }), expect: { handDelta: 1, energy: 3, state: [['players.player_1.graveyard.0.cardId', 'piecie_affoe']] } },
		{ name: 'discarding a Kladje draws 2 more (Discarded: draw 2): +2 -1 +2',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_bagga_of_greed'), hand: ['piecie_energy_surge', 'piecie_affoe'] },
			trigger: act('piecie_bagga_of_greed', { picks: [/Kladje/] }), expect: { handDelta: 3, state: [['players.player_1.graveyard.0.cardId', 'piecie_energy_surge']] } },
	] },
	{ piecie: 'piecie_boosterpackkie', deck: 'starter', section: 'Utility', cases: [
		{ name: 'no Coert: draw 1 and no roll',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_boosterpackkie'), abilityDice: [6] },
			trigger: act('piecie_boosterpackkie'), expect: { mp: { 'own.0': 20 }, handDelta: 1, energy: 3 } },
		{ name: 'a Coert, roll 6: draw 1 and 1 more, no MP',
			setup: { field: own('mosje_coert_tech'), oppField: OPP40, piecies: on('piecie_boosterpackkie'), abilityDice: [6] },
			trigger: act('piecie_boosterpackkie'), expect: { mp: { 'own.0': 20 }, handDelta: 2 } },
		{ name: 'a Coert, roll 5: draw 1 and 1 more',
			setup: { field: own('mosje_coert_tech'), oppField: OPP40, piecies: on('piecie_boosterpackkie'), abilityDice: [5] },
			trigger: act('piecie_boosterpackkie'), expect: { handDelta: 2 } },
		{ name: 'a Coert, roll 4: only the first card',
			setup: { field: own('mosje_coert_tech'), oppField: OPP40, piecies: on('piecie_boosterpackkie'), abilityDice: [4] },
			trigger: act('piecie_boosterpackkie'), expect: { handDelta: 1 } },
	] },
	{ piecie: 'piecie_zie_je_die_dingetjes', deck: 'starter', section: 'Utility', cases: [{
		name: 'top 3: take the 2nd to hand, the rest go back on top in the chosen order (0 Energy)',
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_zie_je_die_dingetjes'), deckTop: ['piecie_affoe', 'piecie_straffoe', 'piecie_larry_zegeltje'] },
		trigger: act('piecie_zie_je_die_dingetjes', { picks: [/Straffoe/, /Larry/] }),
		expect: { handDelta: 1, energy: 3, state: [['players.player_1.hand.0.cardId', 'piecie_straffoe'],
			['players.player_1.deck.0.cardId', 'piecie_larry_zegeltje'], ['players.player_1.deck.1.cardId', 'piecie_affoe']] },
	}] },
	{ piecie: 'piecie_tempiecie', deck: 'starter', section: 'Utility', cases: [{
		name: "a discard-pile card comes to the hand and can't be placed or played this turn (2 Energy)",
		setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_tempiecie'), graveyard: ['piecie_affoe'] },
		trigger: act('piecie_tempiecie'),
		expect: { handDelta: 1, energy: 1, state: [['players.player_1.hand.0.cardId', 'piecie_affoe']] },
		check: (before, after) => { if (!after.players.player_1.hand[0]?.lockedTurn) throw new Error('TemPiecie card is not locked this turn'); },
	}] },
	// -- Tricks: the opponent's hand -----------------------------------------
	{ piecie: 'piecie_stookerino', deck: 'starter', section: 'Utility', cases: [
		{ name: 'no Binti: the opponent discards 1 card of their choice (1 Energy), no MP moves',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_stookerino'), oppHand: ['piecie_pot_of_weed', 'piecie_harde_didde'] },
			trigger: act('piecie_stookerino'), expect: { mp: { 'own.0': 20, 'opp.0': 40 }, energy: 2, oppHandDelta: -1 } },
		{ name: 'a Binti on the field: the opponent still discards 1 card (after the look at their hand)',
			setup: { field: [{ slot: 0, id: MING, mp: 20 }, { slot: 1, id: 'mosje_binti', mp: 20 }], oppField: OPP40, piecies: on('piecie_stookerino'), oppHand: ['piecie_pot_of_weed', 'piecie_harde_didde'] },
			trigger: act('piecie_stookerino'), expect: { mp: { 'own.0': 20, 'own.1': 20 }, energy: 2, oppHandDelta: -1 } },
	] },
	{ piecie: 'piecie_those_eyelashes', deck: 'starter', section: 'Utility', cases: [
		{ name: 'no Martin and no West: refused, nothing paid, nothing discarded',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_those_eyelashes'), oppHand: ['piecie_affoe', 'piecie_straffoe'] },
			trigger: act('piecie_those_eyelashes'), expect: { energy: 3, oppHandDelta: 0, state: [['_snelleBlocked', undefined]] } },
		{ name: 'a Martin: the opponent discards 1 card and cannot play Snelle this turn (2 Energy)',
			setup: { field: own('mosje_martin_driver'), oppField: OPP40, piecies: on('piecie_those_eyelashes'), oppHand: ['piecie_affoe', 'piecie_straffoe'] },
			trigger: act('piecie_those_eyelashes'), expect: { mp: { 'own.0': 20 }, energy: 1, oppHandDelta: -1, state: [['_snelleBlocked', 'player_2']] } },
		{ name: 'a West is enough too',
			setup: { field: own('mosje_fps_west'), oppField: OPP40, piecies: on('piecie_those_eyelashes'), oppHand: ['piecie_affoe', 'piecie_straffoe'] },
			trigger: act('piecie_those_eyelashes'), expect: { energy: 1, oppHandDelta: -1, state: [['_snelleBlocked', 'player_2']] } },
	] },
	{ piecie: 'piecie_jantje_jantje', deck: 'starter', section: 'Attack', cases: [
		{ name: 'hit: name Affoe, the opponent discards it, nothing lost (1 Energy)',
			setup: { field: own(MING, 40), oppField: OPP40, piecies: on('piecie_jantje_jantje'), oppHand: ['piecie_affoe', 'piecie_straffoe'] },
			trigger: act('piecie_jantje_jantje', { picks: [/Affoe/] }),
			expect: { mp: { 'own.0': 40 }, energy: 2, oppHandDelta: -1, state: [['players.player_2.graveyard.0.cardId', 'piecie_affoe']] } },
		{ name: 'miss: the named card is not there, one of your Mosjes loses 10 MP',
			setup: { field: own(MING, 40), oppField: OPP40, piecies: on('piecie_jantje_jantje'), oppHand: ['piecie_straffoe'] },
			trigger: act('piecie_jantje_jantje', { picks: [/Affoe/] }), expect: { mp: { 'own.0': 30 }, oppHandDelta: 0 } },
	] },
	{ piecie: 'piecie_eendjes_voeren', deck: 'starter', section: 'Attack', cases: [
		{ name: 'Spiegelen: your Mosje copies the targeted opponent Mosje Power (10 -> 30) this turn (1 Energy), no MP moves',
			setup: { field: own(MING), oppField: HIT30, piecies: on('piecie_eendjes_voeren') },
			trigger: act('piecie_eendjes_voeren'), expect: { mp: { 'own.0': 20, 'opp.0': 40 }, power: { 'own.0': 30 }, energy: 2 } },
	] },
	// -- Tricks: Quest dice and ease -----------------------------------------
	{ piecie: 'piecie_quest_prep', deck: 'starter', section: 'Utility', cases: [
		{ name: 'Dubbele Dosis (1 Energy): a die grant of 2 for the next Quest roll this turn, no reroll',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_quest_prep') }, trigger: act('piecie_quest_prep'),
			expect: { energy: 2, state: [['players.player_1.questDiceGrants.0.amount', 2], ['players.player_1.rerollGrants', undefined]] } },
		{ name: '+2 dice win a Skilled Quest for a 1-die Mosje: 5 and 5 are two successes, +40',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_quest_prep'), quest: ARM, dice: [5, 5] },
			trigger: act('piecie_quest_prep', { then: roll() }), expect: { mp: { 'own.0': 60 } } },
		{ name: 'without the card the same 1-die roll cannot win: -30',
			setup: { field: own(MING, 40), oppField: OPP40, quest: ARM, dice: [5, 5] }, trigger: roll(), expect: { mp: { 'own.0': 10 } } },
	] },
	{ piecie: 'piecie_loaded_dice', deck: 'starter', section: 'Utility', cases: [
		{ name: 'Gekke Dobbel (0 Energy): one die grant of 1, no reroll',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_loaded_dice') }, trigger: act('piecie_loaded_dice'),
			expect: { energy: 3, state: [['players.player_1.questDiceGrants.0.amount', 1], ['players.player_1.rerollGrants', undefined]] } },
		{ name: 'a Jeffrey rolling gets 2 dice instead: the grant carries a Jeffrey amount of 2',
			setup: { field: own('mosje_jeffrey'), oppField: OPP40, piecies: on('piecie_loaded_dice') }, trigger: act('piecie_loaded_dice'),
			expect: { state: [['players.player_1.questDiceGrants.0.amount', 1], ['players.player_1.questDiceGrants.0.friendAmount.amount', 2]] } },
		{ name: '+1 die for a 1-die Mosje: 6 and 5 are two successes on a Skilled Quest, +40',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_loaded_dice'), quest: ARM, dice: [6, 5] },
			trigger: act('piecie_loaded_dice', { then: roll() }), expect: { mp: { 'own.0': 60 } } },
	] },
	{ piecie: 'piecie_dikke_plaat', deck: 'starter', section: 'Utility', cases: [
		{ name: 'no DJ and no Fissa: +1 die only, no reroll (0 Energy)',
			setup: { field: own(MING), oppField: OPP40, piecies: on('piecie_dikke_plaat') }, trigger: act('piecie_dikke_plaat'),
			expect: { energy: 3, state: [['players.player_1.questExtraDice', 1], ['players.player_1.rerollGrants', undefined]] } },
		{ name: 'a Alyssa, The Bulldozer is not Fissa Fissa!: no reroll',
			setup: { field: own('mosje_alyssa_bulldozer'), oppField: OPP40, piecies: on('piecie_dikke_plaat') }, trigger: act('piecie_dikke_plaat'),
			expect: { state: [['players.player_1.rerollGrants', undefined]] } },
		{ name: 'DJ 80/20 on the field: +1 die and a reroll of 1 die',
			setup: { field: own('mosje_dj_8020'), oppField: OPP40, piecies: on('piecie_dikke_plaat') }, trigger: act('piecie_dikke_plaat'),
			expect: { state: [['players.player_1.questExtraDice', 1], ['players.player_1.rerollGrants.length', 1]] } },
		{ name: 'Alyssa, Fissa Fissa! on the field: +1 die and a reroll of 1 die',
			setup: { field: own('mosje_alyssa_fissa'), oppField: OPP40, piecies: on('piecie_dikke_plaat') }, trigger: act('piecie_dikke_plaat'),
			expect: { state: [['players.player_1.rerollGrants.length', 1]] } },
	] },
	{ piecie: 'piecie_zwoele_ming_power', deck: 'starter', section: 'Utility', cases: [
		{ name: 'control, no card: Michelle (2 dice) rolls 5 and 2 on a Skilled Quest: one success is a fail, -30',
			setup: { field: own('mosje_michelle', 40), oppField: OPP40, quest: ARM, dice: [5, 2] }, trigger: roll(), expect: { mp: { 'own.0': 10 } } },
		{ name: 'the next Quest needs 1 success less: 5 and 2 wins (+40), and a Ming gains 10 MP (2 Energy)',
			setup: { field: [{ slot: 0, id: 'mosje_michelle', mp: 40 }, { slot: 1, id: MING, mp: 20 }], oppField: OPP40, piecies: on('piecie_zwoele_ming_power'), quest: ARM, dice: [5, 2] },
			trigger: act('piecie_zwoele_ming_power', { then: roll() }), expect: { mp: { 'own.0': 80, 'own.1': 30 }, energy: 1 } },
		{ name: 'no Ming on the field: the Quest is still eased, nobody gains MP',
			setup: { field: own('mosje_michelle', 40), oppField: OPP40, piecies: on('piecie_zwoele_ming_power'), quest: ARM, dice: [5, 2] },
			trigger: act('piecie_zwoele_ming_power', { then: roll() }), expect: { mp: { 'own.0': 80 } } },
	] },
	{ piecie: 'piecie_perfect_rhythm', deck: 'starter', section: 'Utility', cases: [
		{ name: 'In De Groove: each of the next two Piecies draws 1; the card does not draw for itself',
			setup: { field: own(MING), oppField: OPP40, energy: 6, piecies: [{ slot: 0, id: 'piecie_perfect_rhythm' }, { slot: 1, id: 'piecie_tweede_kans' }, { slot: 2, id: 'piecie_tweede_kans' }] },
			trigger: act('piecie_perfect_rhythm', { then: act('piecie_tweede_kans', { then: act('piecie_tweede_kans') }) }),
			expect: { handDelta: 2 } },
		{ name: 'with a Chris on the field he gains 10 MP each of the two times (20 -> 40), another Mosje nothing',
			setup: { field: [{ slot: 0, id: MING, mp: 20 }, { slot: 1, id: 'mosje_chris', mp: 20 }], oppField: OPP40, energy: 6, piecies: [{ slot: 0, id: 'piecie_perfect_rhythm' }, { slot: 1, id: 'piecie_tweede_kans' }, { slot: 2, id: 'piecie_tweede_kans' }] },
			trigger: act('piecie_perfect_rhythm', { then: act('piecie_tweede_kans', { then: act('piecie_tweede_kans') }) }),
			expect: { mp: { 'own.0': 20, 'own.1': 40 }, handDelta: 2 } },
	] },
	// -- Tricks: ability use ---------------------------------------------------
	{ piecie: 'piecie_redbull', deck: 'starter', section: 'Utility', cases: [
		{ name: 'Rebouleh (2 Energy): Tuk, The Healing Spirit uses Healing Hands twice this turn and pays 1 Energy each time',
			setup: { field: [{ slot: 0, id: 'mosje_tuk_healer', mp: 30 }, { slot: 1, id: MING, mp: 20 }], oppField: OPP40, energy: 6, piecies: on('piecie_redbull') },
			trigger: act('piecie_redbull', { then: { kind: 'button', mosje: 'mosje_tuk_healer', picks: [/Ming/], then: { kind: 'button', mosje: 'mosje_tuk_healer', picks: [/Ming/] } } }),
			expect: { mp: { 'own.1': 60 }, energy: 2 } },
	] },
];
