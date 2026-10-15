/**
 * mosje-registry-2-0-rest.js - card-test-library entries for the 14 Mosjes that are in no Example Deck (Obby 2.0, Phase 58).
 * Same format as mosje-registry-2-0.js (driver: tests/helpers/mosjeCardTest.js). Every number comes from the Card List text.
 * Complex ability inputs are preset through setup.pendingTargets (the ability is still fired from the real button).
 */
const MILK = 'piecie_kannetje_melk'; // one of your Mosjes gains 25 MP, costs 0 Energy
const milk = (...slots) => slots.map(slot => ({ slot, id: MILK }));
const OPP40 = [{ id: 'mosje_ming_predictor', mp: 40 }];
const OPP_HAND = ['piecie_kannetje_melk', 'piecie_affoe', 'piecie_straffoe'];
const ARM = { stack: 'FIGHTING', id: 'quest_arm_wrestling' }; // Skilled (two 4+), Physical, win +40
const SELF0 = { playerId: 'player_1', slotIndex: 0 };
const OPP0 = { playerId: 'player_2', slotIndex: 0 };

export const MOSJE_REGISTRY_REST = [
	{ mosje: 'mosje_gandoe_destroyer', deck: null, cases: [{
		name: 'Elimination Strike: pay 4 Energy, the lowest-level opponent Mosje goes to the Welloe pile',
		setup: { field: [{ id: 'mosje_gandoe_destroyer', mp: 20 }], oppField: [{ id: 'mosje_ming_predictor', mp: 40 }, { id: 'mosje_jeffrey', mp: 40, level: 2, slot: 1 }], energy: 6 },
		trigger: { kind: 'button' },
		expect: {
			energy: 2,
			check: (before, after) => {
				const opp = after.players.player_2;
				if (opp.welloePile.length !== 1) throw new Error(`Welloe pile has ${opp.welloePile.length} cards`);
				if (opp.activeSlots[0]) throw new Error('the Level 1 Mosje is still on the field');
				if (!opp.activeSlots[1]) throw new Error('the Level 2 Mosje was sent too');
			},
		},
	}] },
	{ mosje: 'mosje_jeffrey', deck: null, cases: [
		{ name: 'Brute Force: a Quest success gives +10 MP extra (20 + 40 + 10)',
			setup: { field: [{ id: 'mosje_jeffrey', mp: 20 }], oppField: OPP40, quest: ARM, dice: [5, 5, 5, 5] },
			trigger: { kind: 'quest', stack: 'FIGHTING' }, expect: { mp: { 'own.0': 70 } } },
		{ name: 'Brute Force: while Jeffrey is on the field an MP Piecie cannot be activated',
			setup: { field: [{ id: 'mosje_jeffrey', mp: 20 }], oppField: OPP40, piecies: milk(0), energy: 3 },
			trigger: { kind: 'activatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 20 }, energy: 3 } },
	] },
	{ mosje: 'mosje_ronald_chef', deck: null, cases: [{
		name: 'Strategic Insight: pay 2 Energy, the chosen card in the opponent hand is set aside',
		setup: { field: [{ id: 'mosje_ronald_chef', mp: 30 }], oppField: OPP40, energy: 3, oppHand: OPP_HAND, pendingTargets: { locked_card: 1 } },
		trigger: { kind: 'button' },
		expect: {
			energy: 1, oppHandDelta: -1,
			check: (before, after) => {
				const aside = after.players.player_2.setAside;
				if (!aside || aside.length !== 1 || aside[0].card.cardId !== 'piecie_affoe') throw new Error('Affoe was not set aside');
			},
		},
	}] },
	{ mosje: 'mosje_ming_natural', deck: null, cases: [
		{ name: 'Lucky Draw: a Piecie on top, add it to my hand',
			setup: { field: [{ id: 'mosje_ming_natural', mp: 30 }], oppField: OPP40, deckTop: [MILK], pendingTargets: { choice: 'hand' } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 30 }, handDelta: 1, energy: 3 } },
		{ name: 'Lucky Draw: a Piecie on top, activate it for free (30 + 25, no Energy)',
			setup: { field: [{ id: 'mosje_ming_natural', mp: 30 }], oppField: OPP40, deckTop: [MILK], pendingTargets: { choice: 'activate' } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 55 }, handDelta: 0, energy: 3 } },
		{ name: 'Lucky Draw: anything else on top is drawn and gains 15 MP',
			setup: { field: [{ id: 'mosje_ming_natural', mp: 30 }], oppField: OPP40, deckTop: ['snelle_jensen'] },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 45 }, handDelta: 1 } },
	] },
	{ mosje: 'mosje_ming_predictor', deck: null, cases: [{
		name: 'Future Sight: look at the top of a Quest stack, pay 1 Energy to put it on the bottom',
		setup: { field: [{ id: 'mosje_ming_predictor', mp: 30 }], oppField: OPP40, energy: 3, pendingTargets: { stack_id: 'FIGHTING', bottom: true } },
		trigger: { kind: 'button' },
		expect: {
			energy: 2,
			check: (before, after) => {
				const b = before.questStacks.FIGHTING.deck, a = after.questStacks.FIGHTING.deck;
				if (a.length !== b.length) throw new Error('stack size changed');
				if (JSON.stringify(a[a.length - 1]) !== JSON.stringify(b[0])) throw new Error('the top card is not on the bottom');
				if (JSON.stringify(a[0]) !== JSON.stringify(b[1])) throw new Error('the next card is not on top');
			},
		},
	}] },
	{ mosje: 'mosje_martin_historian', deck: null, cases: [{
		name: 'Time Control: instead of the normal draw, +15 MP; the end of that turn draws 2',
		setup: { field: [{ id: 'mosje_martin_historian', mp: 30 }], oppField: OPP40, hand: [MILK] },
		trigger: { kind: 'turnStart', picks: [/Historian/, /Your deck/, /./, /./, /./, /./], then: { kind: 'turnEnd' } },
		expect: { mp: { 'own.0': 45 }, handDelta: 2 }, // the normal draw was replaced (0) + 2 at end of turn
	}] },
	{ mosje: 'mosje_martin_senor_west', deck: null, cases: [
		{ name: 'Calculated Guess: right type -> draw 2 and +10 MP',
			setup: { field: [{ id: 'mosje_martin_senor_west', mp: 30 }], oppField: OPP40, deckTop: [MILK], pendingTargets: { card_type: 'PIECIE', deck_owner: 'player_1' } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 40 }, handDelta: 2, energy: 3 } },
		{ name: 'Calculated Guess: wrong type -> lose 10 MP',
			setup: { field: [{ id: 'mosje_martin_senor_west', mp: 30 }], oppField: OPP40, deckTop: [MILK], pendingTargets: { card_type: 'PLACE', deck_owner: 'player_1' } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 20 }, handDelta: 0 } },
	] },
	{ mosje: 'mosje_jeffrey_gambler', deck: null, cases: [
		{ name: 'High Stakes stake 1, roll 1-2: the Energy is lost',
			setup: { field: [{ id: 'mosje_jeffrey_gambler', mp: 30 }], oppField: OPP40, energy: 3, abilityDice: [1], pendingTargets: { stake: 1 } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 30 }, energy: 2, handDelta: 0 } },
		{ name: 'High Stakes stake 1, roll 3-4: the Energy comes back, nothing else',
			setup: { field: [{ id: 'mosje_jeffrey_gambler', mp: 30 }], oppField: OPP40, energy: 3, abilityDice: [3], pendingTargets: { stake: 1 } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 30 }, energy: 3, handDelta: 0 } },
		{ name: 'High Stakes stake 2, roll 5-6: Energy back, draw 1 and +20 MP (10 per Energy)',
			setup: { field: [{ id: 'mosje_jeffrey_gambler', mp: 30 }], oppField: OPP40, energy: 3, abilityDice: [6], pendingTargets: { stake: 2 } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 50 }, energy: 3, handDelta: 1 } },
		{ name: 'High Stakes 5-6: the next Quest success this turn gives +15 extra (30 + 10 + 40 + 15)',
			setup: { field: [{ id: 'mosje_jeffrey_gambler', mp: 30 }], oppField: OPP40, energy: 3, quest: ARM, dice: [5, 5, 5, 5], abilityDice: [5], pendingTargets: { stake: 1 } },
			trigger: { kind: 'button', then: { kind: 'quest', stack: 'FIGHTING' } }, expect: { mp: { 'own.0': 95 } } },
	] },
	{ mosje: 'mosje_youri', deck: null, cases: [{
		name: 'Speed Activate: pay 1 Energy, activate a Piecie the turn it was placed, draw 1 (30 + 25)',
		setup: { field: [{ id: 'mosje_youri', mp: 30 }], oppField: OPP40, energy: 3, hand: [MILK], noUnlock: true },
		trigger: { kind: 'playFromHand', cardId: MILK, then: { kind: 'button', picks: [/./], then: { kind: 'activatePiecie', cardId: MILK } } },
		expect: { mp: { 'own.0': 55 }, energy: 2, handDelta: 0 }, // played (-1) + drawn (+1)
	}] },
	{ mosje: 'mosje_tactician', deck: null, cases: [
		{ name: 'MP Manipulation: pay 2 Energy, set my Mosje to 75 for this turn (no level-up)',
			setup: { field: [{ id: 'mosje_tactician', mp: 30 }], oppField: OPP40, energy: 3, pendingTargets: { target: SELF0, mp: 75 } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 75 }, level: { 'own.0': 1 }, energy: 1 } },
		{ name: 'MP Manipulation: at the end of the turn the real MP comes back',
			setup: { field: [{ id: 'mosje_tactician', mp: 30 }], oppField: OPP40, energy: 3, pendingTargets: { target: SELF0, mp: 75 } },
			trigger: { kind: 'button', then: { kind: 'turnEnd' } }, expect: { mp: { 'own.0': 30 }, level: { 'own.0': 1 } } },
		{ name: 'MP Manipulation: set to 10, gain 25 this turn -> real 30 + 25 at the end of the turn',
			setup: { field: [{ id: 'mosje_tactician', mp: 30 }], oppField: OPP40, energy: 3, piecies: milk(0), pendingTargets: { target: SELF0, mp: 10 } },
			trigger: { kind: 'button', then: { kind: 'activatePiecie', cardId: MILK, then: { kind: 'turnEnd' } } }, expect: { mp: { 'own.0': 55 } } },
		{ name: 'MP Manipulation: set an opponent Mosje to 10 for this turn',
			setup: { field: [{ id: 'mosje_tactician', mp: 30 }], oppField: OPP40, energy: 3, pendingTargets: { target: OPP0, mp: 10 } },
			trigger: { kind: 'button' }, expect: { mp: { 'opp.0': 10 }, energy: 1 } },
	] },
	{ mosje: 'mosje_ronald_mastermind', deck: null, cases: [{
		name: 'Master Plan: pay 2 Energy, activate a Piecie from my discard pile for free (30 + 25); it goes back to the discard pile',
		setup: { field: [{ id: 'mosje_ronald_mastermind', mp: 30 }], oppField: OPP40, energy: 3, graveyard: [MILK], pendingTargets: { discard_card: 0 } },
		trigger: { kind: 'button' },
		expect: {
			mp: { 'own.0': 55 }, energy: 1,
			check: (before, after) => {
				if (!after.players.player_1.graveyard.some(c => c.cardId === MILK)) throw new Error('Kannetje Melk is not back in the discard pile');
			},
		},
	}] },
	{ mosje: 'mosje_coert_kasteluck', deck: null, cases: [
		{ name: 'Morning Luck 4-6: draw 1 (plus the normal draw) and gain 5 MP',
			setup: { field: [{ id: 'mosje_coert_kasteluck', mp: 30 }], oppField: OPP40, abilityDice: [5] },
			trigger: { kind: 'turnStart' }, expect: { mp: { 'own.0': 35 }, handDelta: 2 } },
		{ name: 'Morning Luck 1-3: nothing (only the normal draw)',
			setup: { field: [{ id: 'mosje_coert_kasteluck', mp: 30 }], oppField: OPP40, abilityDice: [3] },
			trigger: { kind: 'turnStart' }, expect: { mp: { 'own.0': 30 }, handDelta: 1 } },
	] },
	{ mosje: 'mosje_martin_driver', deck: null, cases: [
		{ name: 'Perfect Line: a Quest success gives this Mosje 15 MP extra (20 + 25 + 15; Artistic Expression, he has no Physical)',
			setup: { field: [{ id: 'mosje_martin_driver', mp: 20 }], oppField: OPP40, quest: { stack: 'ARTISTIC', id: 'quest_artistic_expression' }, dice: [5, 5, 5, 5] },
			trigger: { kind: 'quest', stack: 'ARTISTIC' }, expect: { mp: { 'own.0': 60 } } },
		{ name: 'Pit Stop: pay 1 Energy and discard 2 cards: draw 3 and gain 10 MP',
			setup: { field: [{ id: 'mosje_martin_driver', mp: 30 }], oppField: OPP40, energy: 3, hand: [MILK, 'piecie_affoe', 'piecie_straffoe'], pendingTargets: { discard_cards: [0, 1] } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 40 }, energy: 2, handDelta: 1 } },
	] },
	{ mosje: 'mosje_tuk_architect', deck: null, cases: [{
		name: 'Perfect Placement: pay 1 Energy, take 2 of the top 5, the rest go to the bottom in my order',
		setup: {
			field: [{ id: 'mosje_tuk_architect', mp: 30 }], oppField: OPP40, energy: 3,
			deckTop: ['piecie_affoe', 'piecie_straffoe', 'piecie_slecht_gezet', 'piecie_quest_prep', 'piecie_larry_zegeltje'],
			pendingTargets: { pick: [0, 1], order: [2, 0, 1] },
		},
		trigger: { kind: 'button' },
		expect: {
			energy: 2, handDelta: 2,
			check: (before, after) => {
				const hand = after.players.player_1.hand.map(c => c.cardId);
				if (!hand.includes('piecie_affoe') || !hand.includes('piecie_straffoe')) throw new Error('picked cards are not in hand');
				const bottom = after.players.player_1.deck.slice(-3).map(c => c.cardId);
				if (JSON.stringify(bottom) !== JSON.stringify(['piecie_larry_zegeltje', 'piecie_slecht_gezet', 'piecie_quest_prep'])) throw new Error(`bottom order ${bottom}`);
			},
		},
	}] },
];
