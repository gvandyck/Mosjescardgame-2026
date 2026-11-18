/**
 * mosje-registry-starter-b.js - card-test-library rows for the starter Creative Mosje abilities (Phase 71-22, D-35 b).
 * Every number comes from the 2.1 text in docs/obby-2.0/handover/card-list.md. Same format as mosje-registry-2-0.js.
 * The pauses (Ming's "Activate it for 0 Energy" / "Keep it in your hand") are the generic option modal, answered by label.
 */
const MILK = 'piecie_kannetje_melk';
const OPP40 = [{ id: 'mosje_ming_predictor', mp: 40 }];
const OPP60 = [{ id: 'mosje_ming_predictor', mp: 60 }];
const OPP_HAND = ['piecie_kannetje_melk', 'piecie_affoe', 'piecie_straffoe'];
const ART = { stack: 'CREATIVE', id: 'quest_artistic_expression' }; // Artistic, win +25
const COIN = { stack: 'PHYSICAL', id: 'quest_geen_raad_vraag_aad' }; // coin flip: one die, 4+ wins +50, a miss loses 25
const LUCKY = /Lucky Beats/;
const BINTI = (level) => ({ field: [{ id: 'mosje_binti', mp: 20, level }], oppField: OPP60, energy: 3, hand: [MILK, 'piecie_affoe', 'piecie_straffoe'], oppHand: OPP_HAND });
const STAKE = (stake, abilityDice, extra = {}) => ({
	field: [{ id: 'mosje_jeffrey_gambler', mp: 30 }], oppField: OPP40, energy: 3, abilityDice: [abilityDice], pendingTargets: { stake }, ...extra,
});

export const MOSJE_REGISTRY_STARTER_B = [
	{ mosje: 'mosje_binti', deck: 'starter', cases: [
		{ name: 'Cutting Words Level 1: pay 1 Energy + discard a Piecie -> an opponent Mosje loses 10, the opponent discards 1',
			setup: BINTI(1), trigger: { kind: 'button' },
			expect: { mp: { 'opp.0': 50 }, energy: 2, handDelta: -1, oppHandDelta: -1 } },
		{ name: 'Cutting Words Level 2: 20 MP instead',
			setup: BINTI(2), trigger: { kind: 'button' },
			expect: { mp: { 'opp.0': 40 }, energy: 2, handDelta: -1, oppHandDelta: -1 } },
		{ name: 'Cutting Words Level 2 on two turns in a row: 20 the first turn, 10 the turn after (60 - 20 - 10)',
			setup: BINTI(2),
			trigger: { kind: 'button', then: { kind: 'turnStart', then: { kind: 'setEnergy', n: 3, then: { kind: 'button' } } } },
			expect: { mp: { 'opp.0': 30 } } },
	] },
	{ mosje: 'mosje_dj_8020', deck: 'starter', cases: [
		{ name: 'Level 1: reroll a failed Quest die once (coin flip 4+, +50: 40 + 50)',
			setup: { field: [{ id: 'mosje_dj_8020', mp: 40 }], oppField: OPP40, quest: COIN, dice: [1], abilityDice: [5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [LUCKY] }, expect: { mp: { 'own.0': 90 } } },
		{ name: 'Level 1: only one reroll - a second miss stays (40 - 25)',
			setup: { field: [{ id: 'mosje_dj_8020', mp: 40 }], oppField: OPP40, quest: COIN, dice: [1], abilityDice: [2, 5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [LUCKY] }, expect: { mp: { 'own.0': 15 } } },
		{ name: 'Level 2: a second reroll (1 -> 2 -> 5, coin flip won: 40 + 50)',
			setup: { field: [{ id: 'mosje_dj_8020', mp: 40, level: 2 }], oppField: OPP40, quest: COIN, dice: [1], abilityDice: [2, 5] },
			trigger: { kind: 'quest', stack: 'PHYSICAL', picks: [LUCKY, LUCKY] }, expect: { mp: { 'own.0': 90 } } },
	] },
	{ mosje: 'mosje_jeffrey_gambler', deck: 'starter', cases: [
		{ name: 'High Stakes stake 1, roll 1-2: the Energy is lost',
			setup: STAKE(1, 1), trigger: { kind: 'button' }, expect: { mp: { 'own.0': 30 }, energy: 2, handDelta: 0 } },
		{ name: 'High Stakes stake 1, roll 3-4: the Energy comes back, nothing else',
			setup: STAKE(1, 3), trigger: { kind: 'button' }, expect: { mp: { 'own.0': 30 }, energy: 3, handDelta: 0 } },
		{ name: 'High Stakes stake 2, roll 3-4: both Energy come back',
			setup: STAKE(2, 4), trigger: { kind: 'button' }, expect: { mp: { 'own.0': 30 }, energy: 3, handDelta: 0 } },
		{ name: 'High Stakes stake 2, roll 5-6: Energy back, draw 1 and +20 MP (10 per Energy)',
			setup: STAKE(2, 6), trigger: { kind: 'button' }, expect: { mp: { 'own.0': 50 }, energy: 3, handDelta: 1 } },
		{ name: 'High Stakes stake 1, roll 5-6: draw 1 and +10 MP',
			setup: STAKE(1, 5), trigger: { kind: 'button' }, expect: { mp: { 'own.0': 40 }, energy: 3, handDelta: 1 } },
		{ name: 'No Quest bonus any more: after a 5-6 the next Quest win is plain (30 + 10 + 25)',
			setup: STAKE(1, 5, { quest: ART, dice: [5, 5, 5, 5] }),
			trigger: { kind: 'button', then: { kind: 'quest', stack: 'CREATIVE', picks: [/./] } }, expect: { mp: { 'own.0': 65 } } },
	] },
	{ mosje: 'mosje_ming_natural', deck: 'starter', cases: [
		{ name: 'Lucky Draw (1 Energy): a Piecie on top, "Activate it for 0 Energy" (30 + 25, hand unchanged)',
			setup: { field: [{ id: 'mosje_ming_natural', mp: 30 }], oppField: OPP40, deckTop: [MILK] },
			trigger: { kind: 'button', picks: [/Activate it/] }, expect: { mp: { 'own.0': 55 }, handDelta: 0, energy: 2 } },
		{ name: 'Lucky Draw: a Piecie on top, "Keep it in your hand" (30 MP, +1 card)',
			setup: { field: [{ id: 'mosje_ming_natural', mp: 30 }], oppField: OPP40, deckTop: [MILK] },
			trigger: { kind: 'button', picks: [/Keep it/] }, expect: { mp: { 'own.0': 30 }, handDelta: 1, energy: 2 } },
		{ name: 'Lucky Draw: a Place on top is just drawn (no pause, no MP)',
			setup: { field: [{ id: 'mosje_ming_natural', mp: 30 }], oppField: OPP40, deckTop: ['place_the_gym'] },
			trigger: { kind: 'button' }, expect: { mp: { 'own.0': 30 }, handDelta: 1, energy: 2 } },
	] },
	{ mosje: 'mosje_ronald_mastermind', deck: 'starter', cases: [
		{ name: 'Master Plan: pay 1 Energy, target an opponent Mosje: it rolls 1 die less on its next Quest',
			setup: { field: [{ id: 'mosje_ronald_mastermind', mp: 30 }], oppField: OPP40, energy: 3 },
			trigger: { kind: 'button', picks: [/Ming/] },
			expect: { energy: 2, check: (before, after) => {
				const g = after.players.player_2.questDiceGrants || [];
				if (!g.some(x => x.amount === -1 && x.lasts === 'untilUsed' && x.slotIndex === 0)) throw new Error('the -1 die mark is missing on the opponent Mosje');
			} } },
	] },
];
