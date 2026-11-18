/**
 * mosje-registry-starter-a.js - card-test-library rows for the starter Physical and Digital Mosje abilities (Phase 71-22, D-35 b).
 * Every number comes from the 2.1 text in docs/obby-2.0/handover/card-list.md. Same format as mosje-registry-2-0.js.
 * Attacks: botAttack(0, 0) = the opponent's slot 0 hits own slot 0. Jeffrey (Strongman) is the attacker: L1 Power 20, L2 25, L3 30.
 * Resilient: each Res star of the target takes 5 off an attack (Alyssa, Michelle, Jeffrey have 1).
 */
const MILK = 'piecie_kannetje_melk'; // food, 0 Energy, +25 MP
const milk = (...slots) => slots.map(slot => ({ slot, id: MILK }));
const OPP40 = [{ id: 'mosje_ming_predictor', mp: 40 }];
const OPP_HAND = ['piecie_kannetje_melk', 'piecie_affoe', 'piecie_straffoe'];
const HIT = (level) => [{ id: 'mosje_jeffrey', mp: 50, level }]; // an attacker of 20 / 25 / 30 Power
const HACK = { stack: 'DIGITAL', id: 'quest_hack_mainframe' }; // Skilled (two 4+), Technical, win +40
const ARM = { stack: 'PHYSICAL', id: 'quest_arm_wrestling' }; // Skilled (two 4+), Strength, win +40
const GEAR = (...ids) => ids.map((id, slot) => ({ slot, id }));
const act = (cardId, then) => ({ kind: 'activatePiecie', cardId, then });

export const MOSJE_REGISTRY_STARTER_A = [
	{ mosje: 'mosje_alyssa_bulldozer', deck: 'starter', cases: [
		{ name: 'Unstoppable: attacked for exactly 20 (25 Power - 5 Resilient): +25 MP and +10 Power (80 - 20 + 25)',
			setup: { field: [{ id: 'mosje_alyssa_bulldozer', mp: 80 }], oppField: HIT(2) },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 85 }, power: { 'own.0': 30 } } },
		{ name: 'Unstoppable: attacked for 15 (20 Power - 5): nothing (80 - 15)',
			setup: { field: [{ id: 'mosje_alyssa_bulldozer', mp: 80 }], oppField: HIT(1) },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 65 }, power: { 'own.0': 20 } } },
	] },
	{ mosje: 'mosje_chris_ddr', deck: 'starter', cases: [
		{ name: 'BigStepper roll 5: another ready Piecie free (15 + 25 + 25)',
			setup: { field: [{ id: 'mosje_chris_ddr', mp: 15 }], oppField: OPP40, piecies: milk(0, 1), abilityDice: [5] },
			trigger: { kind: 'activatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 65 }, state: [['players.player_1.ddrChainsThisTurn', 1]] } },
		{ name: 'BigStepper roll 5 on a free Piecie rolls again, none after two free ones (15 + 3 x 25)',
			setup: { field: [{ id: 'mosje_chris_ddr', mp: 15 }], oppField: OPP40, piecies: milk(0, 1, 2), abilityDice: [5, 5, 5] },
			trigger: { kind: 'activatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 90 }, state: [['players.player_1.ddrChainsThisTurn', 2]] } },
		{ name: 'BigStepper roll 4: no free Piecie (15 + 25)',
			setup: { field: [{ id: 'mosje_chris_ddr', mp: 15 }], oppField: OPP40, piecies: milk(0, 1), abilityDice: [4] },
			trigger: { kind: 'activatePiecie', cardId: MILK }, expect: { mp: { 'own.0': 40 }, state: [['players.player_1.ddrChainsThisTurn', 0]] } },
		{ name: 'BigStepper roll 5 but the player answers "No free Piecie" (15 + 25)',
			setup: { field: [{ id: 'mosje_chris_ddr', mp: 15 }], oppField: OPP40, piecies: milk(0, 1), abilityDice: [5] },
			trigger: { kind: 'activatePiecie', cardId: MILK, picks: [/No free Piecie/] }, expect: { mp: { 'own.0': 40 } } },
	] },
	{ mosje: 'mosje_jeffrey', deck: 'starter', cases: [
		{ name: 'Strongman holds 3 attachments: the third gear goes on without a replace question',
			setup: { field: [{ id: 'mosje_jeffrey', mp: 20 }], oppField: OPP40, energy: 6, piecies: GEAR('piecie_dumbbells', 'piecie_koksmes', 'piecie_rugbybal') },
			trigger: act('piecie_dumbbells', act('piecie_koksmes', act('piecie_rugbybal'))),
			expect: { state: [['players.player_1.activeSlots.0.attachments.2.cardId', 'piecie_rugbybal'], ['players.player_1.graveyard', []]] } },
		{ name: 'Control: another Mosje holds 2, the third gear asks which one to replace (a card goes to the pile)',
			setup: { field: [{ id: 'mosje_michelle', mp: 20 }], oppField: OPP40, energy: 6, piecies: GEAR('piecie_dumbbells', 'piecie_koksmes', 'piecie_rugbybal') },
			trigger: act('piecie_dumbbells', act('piecie_koksmes', act('piecie_rugbybal'))),
			expect: { check: (b, a) => {
				if (a.players.player_1.activeSlots[0].attachments.length !== 2) throw new Error('a Mosje without Strongman holds more than 2');
				if (a.players.player_1.graveyard.filter(c => c.cardId === 'piecie_dumbbells').length !== 1) throw new Error('the replaced gear is not in the pile');
			} } },
		{ name: 'A Quest win is plain (20 + 40), and an MP Piecie can be activated (+25)',
			setup: { field: [{ id: 'mosje_jeffrey', mp: 20 }], oppField: OPP40, quest: ARM, dice: [5, 5], piecies: milk(0) },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/./], then: { kind: 'activatePiecie', cardId: MILK } }, expect: { mp: { 'own.0': 85 } } },
	] },
	{ mosje: 'mosje_michelle', deck: 'starter', cases: [
		{ name: 'Iron Tuk Level 1: a 30 Power attack loses 15 (30 - 10 - 5 Resilient)',
			setup: { field: [{ id: 'mosje_michelle', mp: 50 }], oppField: HIT(3) },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 35 } } },
		{ name: 'Iron Tuk Level 2: 15 less, a 30 Power attack loses 10 (30 - 15 - 5)',
			setup: { field: [{ id: 'mosje_michelle', mp: 50, level: 2 }], oppField: HIT(3) },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 40 } } },
		{ name: 'Iron Tuk: a 10 Power attack (Michelle vs Michelle) is taken away whole (50 stays)',
			setup: { field: [{ id: 'mosje_michelle', mp: 50 }], oppField: [{ id: 'mosje_michelle', mp: 50 }] },
			trigger: { kind: 'attacked' }, expect: { mp: { 'own.0': 50 } } },
		{ name: 'Tough Gamble is gone: a Quest win is the plain +40 (20 + 40)',
			setup: { field: [{ id: 'mosje_michelle', mp: 20 }], oppField: OPP40, quest: ARM, dice: [5, 5], abilityDice: [5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL' }, expect: { mp: { 'own.0': 60 } } },
	] },
	{ mosje: 'mosje_ronald_chef', deck: 'starter', cases: [
		{ name: 'The first food Piecie each turn gives 10 MP more, the second does not (20 + 35 + 25)',
			setup: { field: [{ id: 'mosje_ronald_chef', mp: 20 }], oppField: OPP40, piecies: milk(0, 1) },
			trigger: act(MILK, act(MILK)), expect: { mp: { 'own.0': 80 } } },
		{ name: 'Control: another Mosje gets no extra (20 + 25)',
			setup: { field: [{ id: 'mosje_ming_natural', mp: 20 }], oppField: OPP40, piecies: milk(0) },
			trigger: act(MILK), expect: { mp: { 'own.0': 45 } } },
	] },

	// -- Digital ------------------------------------------------------------
	{ mosje: 'mosje_coert_tech', deck: 'starter', cases: [
		{ name: 'Extra Resources: at the draw step pay 1 Energy per extra card (2 Energy for 2 cards, plus the normal draw)',
			setup: { field: [{ id: 'mosje_coert_tech', mp: 20 }], oppField: OPP40, energy: 3 },
			trigger: { kind: 'turnStart', picks: [/Hawaiian/, /2/] }, expect: { energy: 2, handDelta: 3 } },
		{ name: 'Extra Resources: 1 extra card for 1 Energy',
			setup: { field: [{ id: 'mosje_coert_tech', mp: 20 }], oppField: OPP40, energy: 3 },
			trigger: { kind: 'turnStart', picks: [/Hawaiian/, /1/] }, expect: { energy: 3, handDelta: 2 } },
	] },
	{ mosje: 'mosje_fps_coert', deck: 'starter', cases: [
		{ name: 'Headshot Precision roll 6: a Tech Quest win gives +30 MP and an opponent Mosje loses 15 (20 + 40 + 30; 60 - 15)',
			setup: { field: [{ id: 'mosje_fps_coert', mp: 20 }], oppField: [{ id: 'mosje_ming_predictor', mp: 60 }], quest: HACK, dice: [5, 5], abilityDice: [6] },
			trigger: { kind: 'quest', stack: 'DIGITAL', picks: [/Ming/] }, expect: { mp: { 'own.0': 90, 'opp.0': 45 } } },
		{ name: 'Headshot Precision roll 4: nothing extra (20 + 40; 60)',
			setup: { field: [{ id: 'mosje_fps_coert', mp: 20 }], oppField: [{ id: 'mosje_ming_predictor', mp: 60 }], quest: HACK, dice: [5, 5], abilityDice: [4] },
			trigger: { kind: 'quest', stack: 'DIGITAL', picks: [/./] }, expect: { mp: { 'own.0': 60, 'opp.0': 60 } } },
		{ name: 'Headshot Precision: a Strength Quest does not count (20 + 40; no roll bonus)',
			setup: { field: [{ id: 'mosje_fps_coert', mp: 20 }], oppField: [{ id: 'mosje_ming_predictor', mp: 60 }], quest: { stack: 'PHYSICAL', id: 'quest_tough_it_out' }, dice: [6], abilityDice: [6] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [/./] }, expect: { mp: { 'opp.0': 60 } } },
	] },
	{ mosje: 'mosje_fps_west', deck: 'starter', cases: [
		{ name: 'Tactical Analysis: look at the hand, lose 20 MP, Affoe goes to the bottom of their deck and they draw 1 (30 - 20, 1 Energy)',
			setup: { field: [{ id: 'mosje_fps_west', mp: 30 }], oppField: OPP40, energy: 3, oppHand: OPP_HAND },
			trigger: { kind: 'button', picks: [/Affoe/] },
			expect: { mp: { 'own.0': 10 }, energy: 2, oppHandDelta: 0, check: (b, a) => {
				const hand = a.players.player_2.hand.map(c => c.cardId);
				if (hand.includes('piecie_affoe')) throw new Error('Affoe is still in the opponent hand');
				if (a.players.player_2.deck.length !== b.players.player_2.deck.length) throw new Error('deck size should stay (1 to the bottom, 1 drawn)');
				if (a.players.player_2.deck[a.players.player_2.deck.length - 1].cardId !== 'piecie_affoe') throw new Error('Affoe is not on the bottom');
			} } },
		{ name: 'Tactical Analysis: "Leave it" costs only the 1 Energy (30 MP, hand unchanged)',
			setup: { field: [{ id: 'mosje_fps_west', mp: 30 }], oppField: OPP40, energy: 3, oppHand: OPP_HAND },
			trigger: { kind: 'button', picks: [/Leave it/] }, expect: { mp: { 'own.0': 30 }, energy: 2, oppHandDelta: 0 } },
	] },
	{ mosje: 'mosje_gandoe_wizard', deck: 'starter', cases: [
		{ name: 'Look at the top 3 (1 Energy): take Straffoe, the other two go to the bottom in order',
			setup: { field: [{ id: 'mosje_gandoe_wizard', mp: 10 }], oppField: OPP40, energy: 3, deckTop: ['piecie_affoe', 'piecie_straffoe', 'piecie_slecht_gezet'] },
			trigger: { kind: 'button', picks: [/Straffoe/] },
			expect: { energy: 2, handDelta: 1, mp: { 'own.0': 10 }, check: (b, a) => {
				if (!a.players.player_1.hand.some(c => c.cardId === 'piecie_straffoe')) throw new Error('Straffoe is not in the hand');
				const bottom = a.players.player_1.deck.slice(-2).map(c => c.cardId);
				if (JSON.stringify(bottom) !== JSON.stringify(['piecie_affoe', 'piecie_slecht_gezet'])) throw new Error(`bottom ${bottom}`);
				if (a.players.player_1.deck.length !== b.players.player_1.deck.length - 1) throw new Error('deck should be 1 smaller');
			} } },
		{ name: 'Nothing happens at the start of the turn any more (Chaos Roll is gone): 10 MP, no Power',
			setup: { field: [{ id: 'mosje_gandoe_wizard', mp: 10 }], oppField: OPP40, abilityDice: [1] },
			trigger: { kind: 'turnStart' }, expect: { mp: { 'own.0': 10 }, handDelta: 1 } },
	] },
	{ mosje: 'mosje_youri', deck: 'starter', cases: [
		{ name: 'Speed Activate Level 1: the Piecie played this turn is activated for 1 Energy (30 + 25), no draw',
			setup: { field: [{ id: 'mosje_youri', mp: 30 }], oppField: OPP40, energy: 3, hand: [MILK], noUnlock: true },
			trigger: { kind: 'playFromHand', cardId: MILK, then: { kind: 'button', picks: [/./], then: { kind: 'activatePiecie', cardId: MILK } } },
			expect: { mp: { 'own.0': 55 }, energy: 2, handDelta: -1 } },
		{ name: 'Speed Activate Level 2: then draws 1 (30 + 25, hand unchanged: played 1, drew 1)',
			setup: { field: [{ id: 'mosje_youri', mp: 30, level: 2 }], oppField: OPP40, energy: 3, hand: [MILK], noUnlock: true },
			trigger: { kind: 'playFromHand', cardId: MILK, then: { kind: 'button', picks: [/./], then: { kind: 'activatePiecie', cardId: MILK } } },
			expect: { mp: { 'own.0': 55 }, energy: 2, handDelta: 0 } },
	] },
];
