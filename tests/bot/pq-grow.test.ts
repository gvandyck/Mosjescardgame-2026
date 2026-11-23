// @ts-nocheck
// Phase 73-02 (CC-2, CC-3, CC-9): a Personal Quest keeper grows by Quests, a Level 3 keeper does not trade blows,
// gains go to the keeper, the three starter decks have their own profile.
import { describe, it, expect } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot } from '../helpers/quest56.js';
import { scoreMosjeAction } from '../../src/bot/strategy/scoreMosjeAction.js';
import { keeperActionValue } from '../../src/bot/strategy/keeperActionValue.js';
import { pickOwnSlotByRole } from '../../src/bot/strategy/pickOwnSlotByRole.js';
import { getBotProfile } from '../../src/bot/strategy/botProfiles.js';
import { PQ_VALUES } from '../../src/bot/strategy/pqValues.js';

const pq = (id = 'pq_charge') => ({ cardId: id, type: 'PERSONAL_QUEST' });
const stacks = (faceUp = {}) => {
	const out = {};
	for (const id of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) out[id] = { deck: [], faceUp: faceUp[id] ?? null, tokens: 0, discard: [] };
	return out;
};
const board = (me, opp, q = {}, p1 = {}) =>
	makeEngineState({ questStacks: stacks(q), players: { player_1: { activeSlots: me, ...p1 }, player_2: { activeSlots: opp } } });
const coin = { PHYSICAL: 'quest_geen_raad_vraag_aad' }; // coin flip: Quest value 12.5 against an attack worth 15

describe('keeperActionValue', () => {
	const plan = (phase) => ({ keeperIndex: 0, phase });
	it('is the identity without a plan or for a non-keeper slot', () => {
		expect(keeperActionValue(null, 0, { kind: 'attack', value: 50 })).toBe(50);
		expect(keeperActionValue(plan('grow'), 1, { kind: 'attack', value: 50 })).toBe(50);
		expect(keeperActionValue(plan('ready'), 1, { kind: 'attack', value: 50 })).toBe(50);
	});
	it('grow: Quest x GROW_WEIGHT, attack x KEEPER_ATTACK_WEIGHT unless a finishing blow', () => {
		expect(keeperActionValue(plan('grow'), 0, { kind: 'quest', value: 20 })).toBe(20 * PQ_VALUES.GROW_WEIGHT);
		expect(keeperActionValue(plan('grow'), 0, { kind: 'attack', value: 40 })).toBe(40 * PQ_VALUES.KEEPER_ATTACK_WEIGHT);
		expect(keeperActionValue(plan('grow'), 0, { kind: 'attack', value: PQ_VALUES.FINISH_DROP })).toBe(PQ_VALUES.FINISH_DROP);
	});
	it('ready: only a finishing attack stays; a Quest is unchanged', () => {
		expect(keeperActionValue(plan('ready'), 0, { kind: 'attack', value: 40 })).toBe(0);
		expect(keeperActionValue(plan('ready'), 0, { kind: 'attack', value: PQ_VALUES.FINISH_DROP + 20 })).toBe(PQ_VALUES.FINISH_DROP + 20);
		expect(keeperActionValue(plan('ready'), 0, { kind: 'quest', value: 20 })).toBe(20);
	});
});

describe('scoreMosjeAction with a Personal Quest keeper', () => {
	const mk = (hand) => {
		const me = mkSlot({ mp: 40, subtype: 'PHYSICAL' });
		return board([me, null], [mkSlot({ mp: 60 }), null], coin, { hand: hand.concat([{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }]) });
	};
	it('a growing keeper takes the Quest over an attack it would otherwise prefer', () => {
		const withPq = scoreMosjeAction(mk([pq()]), 'player_1', 0);
		expect(withPq.kind).toBe('quest');
	});
	it('the same board with no Personal Quest in hand attacks as before', () => {
		expect(scoreMosjeAction(mk([]), 'player_1', 0).kind).toBe('attack');
	});
	it('a Level 3 keeper that cannot attempt does not trade blows', () => {
		const me = mkSlot({ level: 3, mp: 60, subtype: 'PHYSICAL' });
		const s = board([me, null], [mkSlot({ mp: 60 }), null], {}, { hand: [pq('pq_sterke_jongen')] });
		expect(scoreMosjeAction(s, 'player_1', 0)).toBeNull();
		const control = board([mkSlot({ level: 3, mp: 60, subtype: 'PHYSICAL' }), null], [mkSlot({ mp: 60 }), null], {}, { hand: [] });
		expect(scoreMosjeAction(control, 'player_1', 0)?.kind).toBe('attack');
	});
	it('a Level 3 keeper still finishes a Mosje', () => {
		const me = mkSlot({ level: 3, mp: 60, subtype: 'PHYSICAL' });
		const s = board([me, null], [mkSlot({ level: 2, mp: 10 }), null], {}, { hand: [pq('pq_sterke_jongen')] });
		expect(scoreMosjeAction(s, 'player_1', 0)?.kind).toBe('attack');
	});
});

describe('pickOwnSlotByRole gain goes to the keeper', () => {
	const mk = (hand) => board([mkSlot({ mp: 60, subtype: 'DIGITAL' }), mkSlot({ mp: 30, subtype: 'PHYSICAL' })], [null, null], {}, { hand });
	it('keeper first', () => {
		expect(pickOwnSlotByRole(mk([pq()]), 'player_1', 'gain', [0, 1])).toBe(1);
	});
	it('no Personal Quest: unchanged', () => {
		const s = mk([]);
		expect(pickOwnSlotByRole(s, 'player_1', 'gain', [0, 1])).toBe(0);
	});
	it('other roles unchanged', () => {
		expect(pickOwnSlotByRole(mk([pq()]), 'player_1', 'defense', [0, 1])).toBe(0);
	});
});

describe('starter deck profiles (CC-9)', () => {
	it('Physical, Digital, Creative', () => {
		const prof = (deckId) => getBotProfile({ players: { player_1: { deckId } } }, 'player_1');
		expect(prof('STARTER_PHYSICAL')).toMatchObject({ riskTolerance: 0.55, comboPatience: 0.2, preferAttack: true });
		expect(prof('STARTER_DIGITAL')).toMatchObject({ riskTolerance: 0.5, comboPatience: 0.4, preferAttack: false });
		expect(prof('STARTER_CREATIVE')).toMatchObject({ riskTolerance: 0.5, comboPatience: 0.4, preferAttack: false });
		expect(prof('STARTER_PHYSICAL').archetype).not.toBe('balanced');
		expect(prof('NOPE').archetype).toBe('balanced');
	});
});
