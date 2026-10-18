// @ts-nocheck
// BOT-04 guard: "the bot only sees the table". Three layers, all inside `npm test`:
//  1. TRAP_TABLE: every state-taking export of src/bot/strategy runs on a trap state (hidden arrays throw on any element read).
//  2. A source scan: a new state-taking export that is missing from TRAP_TABLE fails, naming the function.
//  3. Invariance: changing only hidden information changes no decision (and not even the view).
// Later plans add every new state-taking chooser to TRAP_TABLE and project it with asBotView.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createInitialGameState } from '../../src/engine/gameState.js';
import { startTurn } from '../../src/engine/turnManager.js';
import { driveBotTurn } from '../../src/bot/botDriver.js';
import { QUESTS } from '../../src/data/quests.js';
import { PIECIES } from '../../src/data/piecies.js';
import { getQuestDef } from '../../src/engine/quests/getQuestDef.js';
import { canMosjeTakeAction } from '../../src/engine/actions/canMosjeTakeAction.js';
import { MOSJE_ABILITY_RULES } from '../../src/rules/mosjeAbilityRules.js';
import { OWN_TARGET_EFFECT_IDS } from '../../src/engine/targets/ownTargetEffects.js';
import { getBotView } from '../../src/bot/strategy/getBotView.js';
import { asBotView } from '../../src/bot/strategy/asBotView.js';
import { getBotProfile } from '../../src/bot/strategy/botProfiles.js';
import { chooseMosjeAction } from '../../src/bot/strategy/chooseMosjeAction.js';
import { scoreMosjeAction } from '../../src/bot/strategy/scoreMosjeAction.js';
import { orderActingMosjes } from '../../src/bot/strategy/orderActingMosjes.js';
import { chooseQuestChoices } from '../../src/bot/strategy/chooseQuestChoices.js';
import { chooseQuestCostChoice } from '../../src/bot/strategy/chooseQuestCostChoice.js';
import { chooseReaction } from '../../src/bot/strategy/chooseReaction.js';
import { chooseTriggerChoice } from '../../src/bot/strategy/chooseTriggerChoice.js';
import { defaultAbilityInputs } from '../../src/bot/strategy/defaultAbilityInputs.js';
import { pickBotOwnTarget } from '../../src/bot/strategy/pickBotOwnTarget.js';
import { pickMosjeOption } from '../../src/bot/strategy/pickMosjeOption.js';
import { pickOwnSlotByRole } from '../../src/bot/strategy/pickOwnSlotByRole.js';
import { pickDjRerollDie } from '../../src/bot/strategy/pickDjRerollDie.js';
import { planPiecieActivations } from '../../src/bot/strategy/planPiecieActivations.js';
import { isUsefulActivation } from '../../src/bot/strategy/isUsefulActivation.js';
import { getBotPaymentCost } from '../../src/bot/strategy/getBotPaymentCost.js';
import { canBotAfford } from '../../src/bot/strategy/canBotAfford.js';
import { chooseSummon } from '../../src/bot/strategy/chooseSummon.js';
import { shouldUseAbility } from '../../src/bot/strategy/shouldUseAbility.js';
import { choosePlaceToPlay } from '../../src/bot/strategy/choosePlaceToPlay.js';
import { opponentThreat } from '../../src/bot/strategy/opponentThreat.js';
import { reactionReserve } from '../../src/bot/strategy/reactionReserve.js';
import { choosePieciesToPlace } from '../../src/bot/strategy/choosePieciesToPlace.js';
import { pickDefensiveSnelle } from '../../src/bot/strategy/pickDefensiveSnelle.js';
import { makeTrapState } from '../helpers/hiddenTrap.js';

const SEATS = ['player_1', 'player_2'];
const other = (seat) => (seat === 'player_1' ? 'player_2' : 'player_1');
const clone = (x) => JSON.parse(JSON.stringify(x));
const card = (cardId, type = 'PIECIE') => ({ cardId, type });

function mulberry32(seed) {
	return function () {
		seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

let origRandom;
let base;
beforeEach(() => {
	origRandom = Math.random;
	Math.random = mulberry32(0xB07C0DE);
	const players = [{ playerId: 'player_1', name: 'A', deckId: 'EXAMPLE_REGELAARS' }, { playerId: 'player_2', name: 'B', deckId: 'EXAMPLE_CREATIEVELINGEN' }];
	let state = startTurn(createInitialGameState(players, 'NO_HIDDEN_INFO', { firstPlayerId: 'player_1' }));
	for (let round = 0; round < 6 && state.status !== 'FINISHED'; round++) {
		const next = driveBotTurn(state, state.activePlayerId);
		if (next.status === 'FINISHED') break;
		state = startTurn(next);
	}
	base = state;
});
afterEach(() => { Math.random = origRandom; });

// A copy of the base game for `seat`: its turn, a Mosje in slot 0 that can act, no open pause; the opponent has a
// face-down Piecie, the seat holds cards and a ready Piecie.
function prepare(seat) {
	const st = clone(base);
	st.activePlayerId = seat;
	for (const key of ['pendingDrawStep', 'pendingChoice', 'pendingReaction', 'pendingQuestRoll']) delete st[key];
	const me = st.players[seat];
	const opp = st.players[other(seat)];
	me.cooldownTurn = false;
	Object.assign(me.activeSlots[0], { isDefeated: false, sideways: false, actedThisTurn: false });
	const down = (cardId, ready) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: st.turnNumber - 1, canActivateOnTurn: ready ? st.turnNumber : st.turnNumber + 1 });
	if (!opp.piecieSlots.some((s) => s && s.faceDown)) opp.piecieSlots[0] = down(PIECIES[3].id, false);
	if (!opp.hand.length) opp.hand.push(card(PIECIES[1].id));
	if (!me.hand.some((c) => c.type === 'PIECIE')) me.hand.push(card(PIECIES[0].id));
	me.piecieSlots[2] = down(PIECIES[0].id, true);
	return st;
}

// The seat gets Energy, a Mosje, two Places and Tesla in hand, an open field slot and no Place in play, so the payment
// choosers reach every branch that reads its own hand.
const PAYMENTS = [['mosje_alyssa_fissa', 'mosje'], ['place_the_gym', 'place'], ['piecie_te_hard_gaan', 'piecie'], ['snelle_blensen', 'snelle'], ['ability_ronald_chef_strategic_insight', 'ability'], ['ability_gandoe_destroyer_elimination_strike', 'ability']];
function withShopping(t, seat) {
	const me = t.players[seat];
	const hand = [...me.hand, card('mosje_alyssa_fissa', 'MOSJE'), card('place_the_gym', 'PLACE'), card('place_tesla', 'PLACE')];
	return { ...t, activePlace: null, players: { ...t.players, [seat]: { ...me, energy: 6, hand, activeSlots: [me.activeSlots[0], null] } } };
}

// The seat holds a reaction Snelle (Jensen!), so the reserve choosers reach their kept-slot / kept-Energy branch.
function withReaction(t, seat) {
	const me = t.players[seat];
	return { ...t, players: { ...t.players, [seat]: { ...me, hand: [...me.hand, { cardId: 'snelle_jensen', type: 'SNELLE_PIECIE' }] } } };
}

const faceUpQuestIds = (st) => Object.values(st.questStacks).map((s) => s.faceUp).filter(Boolean);

// One entry per state-taking export of src/bot/strategy: (trap, seat) => calls it, on every branch we can reach.
const TRAP_TABLE = {
	getBotView: (t, seat) => getBotView(t, seat),
	asBotView: (t, seat) => asBotView(t, seat),
	getBotProfile: (t, seat) => getBotProfile(t, seat),
	chooseMosjeAction: (t, seat) => [0, 1].map((i) => chooseMosjeAction(t, seat, i)),
	scoreMosjeAction: (t, seat) => [0, 1].map((i) => scoreMosjeAction(t, seat, i)),
	orderActingMosjes: (t, seat) => { expect(orderActingMosjes(t, seat)).toBeInstanceOf(Array); },
	chooseQuestChoices: (t, seat) => {
		const ids = [...faceUpQuestIds(t), 'quest_parkeren_delft', 'quest_geen_raad_vraag_aad'];
		for (const questId of ids) for (const win of [true, false]) chooseQuestChoices(t, seat, { questId, win, discardedCardIds: [] });
	},
	chooseQuestCostChoice: (t, seat) => {
		for (const id of faceUpQuestIds(t)) chooseQuestCostChoice(t, seat, 0, getQuestDef(id));
		for (const quest of QUESTS) chooseQuestCostChoice(t, seat, 0, quest); // every cost kind
	},
	chooseReaction: (t, seat) => {
		const stackId = Object.keys(t.questStacks)[0];
		const window = { id: 'r1', responderId: seat, actorId: other(seat), eligible: [], preview: { getemt: [0], toWelloe: false, mpLoss: { 0: 20 } }, action: { type: 'attack', args: [other(seat), { slotIndex: 0 }] }, queue: [] };
		const roll = { questId: t.questStacks[stackId].faceUp, playerId: seat, dice: [1, 2], win: false };
		const rollWindow = { ...window, action: { type: 'rollQuest', args: [seat, { slotIndex: 0, stackId }] } };
		const dj = ['snelle_sleutelpuntje', 'snelle_lucky_coin', 'djReroll:0', 'djReroll:1'];
		const fixtures = [
			{ ...window, moments: ['targeted', 'wouldLoseMp'] },
			{ ...window, moments: ['targeted', 'wouldLoseMp'], eligible: ['snelle_jensen', 'snelle_frenssen'] },
			{ ...window, moments: ['jensenPlayed'], eligible: ['snelle_frenssen'] },
			{ ...rollWindow, moments: ['beforeOwnQuestRoll'], eligible: dj },
			{ ...rollWindow, moments: ['afterOwnQuestRoll'], eligible: dj },
			{ ...rollWindow, moments: ['afterQuestRoll'], eligible: dj },
		];
		for (const pendingReaction of fixtures) chooseReaction({ ...t, pendingReaction, pendingQuestRoll: roll }, seat);
	},
	chooseTriggerChoice: (t, seat) => {
		chooseTriggerChoice({ ...t, pendingChoice: { hook: 'trigger', playerId: seat, key: 'k', options: [{ slotIndex: 0 }, { slotIndex: 1 }] } }, seat);
		const options = [0, 1].map((slotIndex) => ({ playerId: other(seat), slotIndex, label: 'opp' }));
		chooseTriggerChoice({ ...t, pendingChoice: { hook: 'piecie', playerId: seat, key: 'k', choiceKind: 'mosje', options } }, seat);
	},
	defaultAbilityInputs: (t, seat) => {
		for (const [id, rule] of Object.entries(MOSJE_ABILITY_RULES)) if (rule.kind === 'activated') defaultAbilityInputs(t, seat, id);
	},
	pickBotOwnTarget: (t, seat) => { for (const effectId of OWN_TARGET_EFFECT_IDS) pickBotOwnTarget(t, seat, effectId); },
	pickOwnSlotByRole: (t, seat) => { for (const role of ['power', 'self-loss', 'defense', 'gain']) expect(pickOwnSlotByRole(t, seat, role, [0, 1], 10)).toBeGreaterThanOrEqual(0); },
	pickMosjeOption: (t, seat) => {
		const options = (playerId, ...slots) => slots.map((slotIndex) => ({ playerId, slotIndex, label: `${playerId}:${slotIndex}` }));
		const choice = (opts, piecieId) => ({ hook: 'piecie', playerId: seat, choiceKind: 'mosje', options: opts, ...(piecieId ? { piecie: { cardDef: { id: piecieId } } } : {}) });
		// Slot 0 of each seat holds a Mosje; slot 1 may be empty, which makes its option malformed (still no throw).
		expect(pickMosjeOption(t, seat, choice(options(other(seat), 0)))).toBeDefined(); // the opponent's Mosjes
		for (const piecieId of ['piecie_warm_kannetje_melk', 'piecie_kannetje_melk']) expect(pickMosjeOption(t, seat, choice(options(seat, 0), piecieId))).toBeDefined(); // own: self-loss and gain
		pickMosjeOption(t, seat, choice(options(other(seat), 0, 1)));
		pickMosjeOption(t, seat, choice(options(seat, 0, 1), 'piecie_stripje_bennies'));
		expect(pickMosjeOption(t, seat, choice([...options(seat, 0), ...options(other(seat), 0)]))).toBeUndefined(); // mixed
	},
	pickDjRerollDie: (t, seat) => {
		const eligible = ['djReroll:0', 'djReroll:1', 'piecieReroll:0', 'piecieReroll:1'];
		const questId = faceUpQuestIds(t)[0];
		for (const [playerId, win] of [[seat, false], [other(seat), true], [seat, true]]) {
			const withRoll = { ...t, pendingQuestRoll: { questId, playerId, dice: [1, 2], win } };
			pickDjRerollDie(withRoll, seat, eligible);
			pickDjRerollDie(withRoll, seat, eligible, 'piecieReroll:');
		}
	},
	planPiecieActivations: (t, seat) => planPiecieActivations(t, seat, getBotProfile(t, seat), { willQuest: true }),
	isUsefulActivation: (t, seat) => { for (const piecie of PIECIES) isUsefulActivation(t, seat, piecie.id); },
	getBotPaymentCost: (t, seat) => { for (const [id, kind] of PAYMENTS) getBotPaymentCost(withShopping(t, seat), seat, id, kind); },
	canBotAfford: (t, seat) => { for (const [id, kind] of PAYMENTS) canBotAfford(withShopping(t, seat), seat, id, kind, 1); },
	chooseSummon: (t, seat) => { expect(chooseSummon(withShopping(t, seat), seat)?.cardId).toBe('mosje_alyssa_fissa'); },
	shouldUseAbility: (t, seat) => { for (const i of [0, 1]) shouldUseAbility(withShopping(t, seat), seat, i, getBotProfile(t, seat), 1); },
	choosePlaceToPlay: (t, seat) => { expect(choosePlaceToPlay(withShopping(t, seat), seat, 1)?.cardId).toBe('place_the_gym'); },
	opponentThreat: (t, seat) => { expect(opponentThreat(t, seat)).toBeGreaterThanOrEqual(0); },
	reactionReserve: (t, seat) => { expect(reactionReserve(withReaction(t, seat), seat)).toMatchObject({ keepSlot: true, energy: 1 }); },
	choosePieciesToPlace: (t, seat) => { expect(choosePieciesToPlace(withReaction(t, seat), seat)).toBeInstanceOf(Array); },
	pickDefensiveSnelle: (t, seat) => {
		const eligible = ['snelle_jensen', 'snelle_counter_strikka', 'snelle_blensen', 'snelle_the_protector', 'snelle_perfect_dodge', 'snelle_drain_reversal', 'snelle_emergency_healings', 'snelle_negate_elimination'];
		const action = { type: 'attack', args: [other(seat), { attackerSlotIndex: 0, targetPlayerId: seat, targetSlotIndex: 0 }] };
		const base = { id: 'r1', responderId: seat, actorId: other(seat), eligible, action, queue: [] };
		const preview = { getemt: [0], toWelloe: false, mpLoss: { 0: 20 }, welloeSlots: [] };
		for (const [moments, extra] of [[['attacked', 'wouldLoseMp'], {}], [['targeted', 'wouldLoseMp'], {}], [['attacked', 'wouldLoseMp', 'toWelloe'], { toWelloe: true, welloeSlots: [0] }]]) {
			pickDefensiveSnelle({ ...t, pendingReaction: { ...base, moments, preview: { ...preview, ...extra } } }, seat);
		}
	},
};

describe('BOT-04 trap states: no strategy export reads hidden information', () => {
	for (const seat of SEATS) {
		for (const [name, run] of Object.entries(TRAP_TABLE)) {
			it(`${name} runs on a trap state for ${seat}`, () => {
				const st = prepare(seat);
				expect(st.players[other(seat)].piecieSlots.some((s) => s && s.faceDown)).toBe(true);
				expect(st.players[seat].hand.length).toBeGreaterThan(0);
				expect(canMosjeTakeAction(st, seat, 0).ok).toBe(true); // so the Mosje choosers reach their dry-runs
				expect(() => run(makeTrapState(st, seat), seat)).not.toThrow();
			});
		}
	}

	it('the trap really traps: an unprojected read of the opponent hand throws', () => {
		const trap = makeTrapState(prepare('player_1'), 'player_1');
		expect(() => trap.players.player_2.hand.map((c) => c.cardId)).toThrow(/hidden read/);
		expect(() => JSON.stringify(trap)).toThrow(/hidden read/);
	});
});

describe('BOT-04 source scan: every state-taking export is in the trap table', () => {
	const dir = fileURLToPath(new URL('../../src/bot/strategy/', import.meta.url));
	const found = [];
	for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
		const src = readFileSync(dir + file, 'utf8');
		for (const m of src.matchAll(/export function (\w+)\s*\(\s*(state|view|gameState)\b/g)) found.push({ name: m[1], file });
	}

	it('finds the state-taking exports', () => {
		expect(found.length).toBeGreaterThanOrEqual(12);
	});
	for (const { name, file } of found) {
		it(`${name} (${file}) is in TRAP_TABLE`, () => {
			expect(Object.keys(TRAP_TABLE), `add ${name} to TRAP_TABLE and project with asBotView`).toContain(name);
		});
	}
	it('TRAP_TABLE holds no stale entry', () => {
		expect(Object.keys(TRAP_TABLE).filter((n) => !found.some((f) => f.name === n))).toEqual([]);
	});
	it('the choosers retrofitted in 61-01 project onto the table view on entry', () => {
		for (const f of ['chooseMosjeAction', 'chooseQuestChoices', 'chooseQuestCostChoice', 'chooseReaction', 'chooseTriggerChoice', 'defaultAbilityInputs', 'pickBotOwnTarget', 'pickDjRerollDie', 'planPiecieActivations']) {
			expect(readFileSync(`${dir}${f}.js`, 'utf8'), f).toMatch(/asBotView\(/);
		}
	});
	it('the Piecie usefulness check and the Mosje pick added in 61-05 project onto the table view on entry', () => {
		for (const f of ['isUsefulActivation', 'pickMosjeOption', 'pickOwnSlotByRole']) {
			expect(readFileSync(`${dir}${f}.js`, 'utf8'), f).toMatch(/asBotView\(/);
		}
	});
	it('the defender reaction pick added in 61-07 projects onto the table view on entry', () => {
		for (const f of ['pickDefensiveSnelle']) {
			expect(readFileSync(`${dir}${f}.js`, 'utf8'), f).toMatch(/asBotView\(/);
		}
	});
	it('the reaction reserve and the Piecie placement added in 61-06 project onto the table view on entry', () => {
		for (const f of ['reactionReserve', 'choosePieciesToPlace']) {
			expect(readFileSync(`${dir}${f}.js`, 'utf8'), f).toMatch(/asBotView\(/);
		}
	});
	it('the payment choosers added in 61-02, the threat read added in 61-03 and the action score and order added in 61-04 project onto the table view on entry', () => {
		for (const f of ['getBotPaymentCost', 'canBotAfford', 'chooseSummon', 'shouldUseAbility', 'choosePlaceToPlay', 'opponentThreat', 'scoreMosjeAction', 'orderActingMosjes']) {
			expect(readFileSync(`${dir}${f}.js`, 'utf8'), f).toMatch(/asBotView\(/);
		}
	});
});

// Everything the seat may not see, changed: other hand cards of the same count, reversed decks and Quest stack decks,
// other face-down Piecie ids, and what the opponent has seen.
function scramble(st, seat) {
	const out = clone(st);
	const opp = out.players[other(seat)];
	opp.hand = opp.hand.map((c, i) => ({ cardId: `scrambled_${i}`, type: c.type }));
	for (const p of Object.values(out.players)) p.deck.reverse();
	for (const stack of Object.values(out.questStacks)) stack.deck.reverse();
	opp.piecieSlots = opp.piecieSlots.map((s, i) => (s && s.faceDown ? { ...s, cardId: PIECIES[(i + 7) % PIECIES.length].id } : s));
	out.revealed = { ...(out.revealed || {}), [other(seat)]: [{ source: 'x', cardIds: ['scrambled_0'], turnNumber: out.turnNumber }] };
	return out;
}

describe('BOT-04 invariance: only hidden information differs, the decisions do not', () => {
	for (const seat of SEATS) {
		it(`the view of ${seat} is identical`, () => {
			const a = prepare(seat);
			expect(JSON.stringify(a.players[other(seat)].hand)).not.toBe(JSON.stringify(scramble(a, seat).players[other(seat)].hand));
			expect(getBotView(scramble(a, seat), seat)).toEqual(getBotView(a, seat));
		});
		it(`chooseMosjeAction, planPiecieActivations and chooseQuestCostChoice agree for ${seat}`, () => {
			const a = prepare(seat);
			const b = scramble(a, seat);
			for (const i of [0, 1]) {
				expect(chooseMosjeAction(b, seat, i)).toEqual(chooseMosjeAction(a, seat, i));
				expect(scoreMosjeAction(b, seat, i)).toEqual(scoreMosjeAction(a, seat, i));
			}
			expect(orderActingMosjes(b, seat)).toEqual(orderActingMosjes(a, seat));
			const profile = getBotProfile(a, seat);
			expect(planPiecieActivations(b, seat, profile, { willQuest: true })).toEqual(planPiecieActivations(a, seat, profile, { willQuest: true }));
			expect(planPiecieActivations(a, seat, profile, { willQuest: true }).length).toBeGreaterThan(0); // the ready Piecie is planned
			for (const quest of QUESTS) expect(chooseQuestCostChoice(b, seat, 0, quest)).toEqual(chooseQuestCostChoice(a, seat, 0, quest));
		});
	}
});
