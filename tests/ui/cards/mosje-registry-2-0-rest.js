/**
 * mosje-registry-2-0-rest.js - card-test-library entries for the 14 Mosjes that are in no Example Deck (Obby 2.0, Phase 58).
 * Same format as mosje-registry-2-0.js (driver: tests/helpers/mosjeCardTest.js). Every number comes from the Card List text.
 * Complex ability inputs are preset through setup.pendingTargets (the ability is still fired from the real button).
 */
const MILK = 'piecie_kannetje_melk'; // one of your Mosjes gains 25 MP, costs 0 Energy
const milk = (...slots) => slots.map(slot => ({ slot, id: MILK }));
const OPP40 = [{ id: 'mosje_ming_predictor', mp: 40 }];
const OPP_HAND = ['piecie_kannetje_melk', 'piecie_affoe', 'piecie_straffoe'];
const ARM = { stack: 'PHYSICAL', id: 'quest_arm_wrestling' }; // Skilled (two 4+), Strength, win +40
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
	{ mosje: 'mosje_martin_senor_west', deck: null, cases: [
		{ name: 'Calculated Guess: right type -> draw 2 and +10 MP',
			setup: { field: [{ id: 'mosje_martin_senor_west', mp: 30 }], oppField: OPP40, deckTop: [MILK], pendingTargets: { card_type: 'PIECIE', deck_owner: 'player_1' } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 40 }, handDelta: 2, energy: 3 } },
		{ name: 'Calculated Guess: wrong type -> lose 10 MP',
			setup: { field: [{ id: 'mosje_martin_senor_west', mp: 30 }], oppField: OPP40, deckTop: [MILK], pendingTargets: { card_type: 'PLACE', deck_owner: 'player_1' } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 20 }, handDelta: 0 } },
	] },
	{ mosje: 'mosje_coert_kasteluck', deck: null, cases: [
		{ name: 'Morning Luck 4-6: draw 1 (plus the normal draw) and gain 5 MP',
			setup: { field: [{ id: 'mosje_coert_kasteluck', mp: 30 }], oppField: OPP40, abilityDice: [5] },
			trigger: { kind: 'turnStart' }, expect: { mp: { 'own.0': 35 }, handDelta: 2 } },
		{ name: 'Morning Luck 1-3: nothing (only the normal draw)',
			setup: { field: [{ id: 'mosje_coert_kasteluck', mp: 30 }], oppField: OPP40, abilityDice: [3] },
			trigger: { kind: 'turnStart' }, expect: { mp: { 'own.0': 30 }, handDelta: 1 } },
	] },
	{ mosje: 'mosje_martin_driver', deck: null, cases: [
		{ name: 'Perfect Line: a Quest success gives this Mosje 15 MP extra (20 + 25 + 15; Artistic Expression, he has no Strength)',
			setup: { field: [{ id: 'mosje_martin_driver', mp: 20 }], oppField: OPP40, quest: { stack: 'CREATIVE', id: 'quest_artistic_expression' }, dice: [5, 5, 5, 5] },
			trigger: { kind: 'quest', stack: 'CREATIVE' }, expect: { mp: { 'own.0': 60 } } },
		{ name: 'Pit Stop: pay 1 Energy and discard 2 cards: draw 3 and gain 10 MP',
			setup: { field: [{ id: 'mosje_martin_driver', mp: 30 }], oppField: OPP40, energy: 3, hand: [MILK, 'piecie_affoe', 'piecie_straffoe'], pendingTargets: { discard_cards: [0, 1] } },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 40 }, energy: 2, handDelta: 1 } },
	] },
];
