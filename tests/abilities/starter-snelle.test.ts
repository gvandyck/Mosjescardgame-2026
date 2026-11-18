// @ts-nocheck
// Phase 71-16 (D-31, D-06): the eight starter Snelle on the 2.1 text, in the window their text names: Aansteker
// (snelle_momentum_rush), Chris's Handdoek (snelle_chriss_handdoek), Oh nee toch niet (snelle_emergency_healings),
// Ff Haaltje Nemen (snelle_ff_haaltje_nemen), Lucky Coin (snelle_lucky_coin), Jensen! (snelle_jensen), Je Weet Niet
// (snelle_jeweetniet) and Sleutelpuntje (snelle_sleutelpuntje). Real engine: attackMosje, rollQuestAttempt, resolveReaction.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { attackMosje } from '../../src/engine/actions/attackMosje.js';
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';
import { rollPersonalQuestAttempt } from '../../src/engine/personalQuests/rollPersonalQuestAttempt.js';
import { resolveReaction } from '../../src/engine/reactions/resolveReaction.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { playSnellie, useMosjeAbility } from '../../src/engine/turnManager.js';
import { snelleConditionMet } from '../../src/rules/snelleConditions.js';
import * as fx from '../../src/abilities/snelleEffects.js';

afterEach(() => vi.restoreAllMocks());

const m = (id) => MOSJES.find((x) => x.id === id);
const def = (id) => SNELLE_PIECIES.find((d) => d.id === id);
const H = (...ids) => ids.map((cardId) => ({ cardId, type: cardId.startsWith('snelle') ? 'SNELLE_PIECIE' : cardId.startsWith('pq_') ? 'PERSONAL_QUEST' : 'PIECIE' }));

// ---------- Aansteker ----------
const ming = m('mosje_ming_predictor');
const mk = (mp, extra = {}) => Object.assign(createMosjeSlot(ming, { level: 1, mp }), { entryProtected: false }, extra);
function attackBoard(attacker, p2hand = H('snelle_momentum_rush')) {
	return makeEngineState({
		turnNumber: 3,
		players: {
			player_1: { activeSlots: [attacker, null], energy: 6 },
			player_2: { activeSlots: [mk(50), null], hand: p2hand, energy: 6 },
		},
	});
}
const ATTACK = { attackerSlotIndex: 0, targetPlayerId: 'player_2', targetSlotIndex: 0 };

describe('Aansteker (snelle_momentum_rush)', () => {
	it('is offered to the defender when an opponent Mosje attacks', () => {
		const r = attackMosje(attackBoard(mk(50)), 'player_1', ATTACK);
		expect(r.state.pendingReaction.responderId).toBe('player_2');
		expect(r.state.pendingReaction.moments).toContain('attacked');
		expect(r.state.pendingReaction.eligible).toContain('snelle_momentum_rush');
	});
	it('the attacker loses 15 MP (a Resilient 2 attacker too), then the attack happens as declared', () => {
		const passed = resolveReaction(attackMosje(attackBoard(mk(50, { traits: { resilient: 2 } })), 'player_1', ATTACK).state, 'player_2', null).state;
		const w = attackMosje(attackBoard(mk(50, { traits: { resilient: 2 } })), 'player_1', ATTACK).state;
		const out = resolveReaction(w, 'player_2', 'snelle_momentum_rush').state;
		expect(out.players.player_1.activeSlots[0].mp).toBe(35);
		expect(out.players.player_2.activeSlots[0].mp).toBe(passed.players.player_2.activeSlots[0].mp); // same hit as without the card
		expect(out.players.player_2.activeSlots[0].mp).toBeLessThan(50);
	});
	it('an attacker taken to 0 MP cannot attack any more: the attack fizzles', () => {
		const w = attackMosje(attackBoard(mk(15)), 'player_1', ATTACK).state;
		const out = resolveReaction(w, 'player_2', 'snelle_momentum_rush').state;
		const a = out.players.player_1.activeSlots[0];
		expect(a.mp).toBe(0);
		expect(a.sideways).toBe(true);
		expect(out.players.player_2.activeSlots[0].mp).toBe(50);
	});
	it('on the player\'s own attack it is not offered', () => {
		const s = attackBoard(mk(50), []);
		s.players.player_1.hand = H('snelle_momentum_rush');
		expect(attackMosje(s, 'player_1', ATTACK).state.pendingReaction).toBeUndefined();
	});
	it('played freely outside a window it does nothing', () => {
		const s = attackBoard(mk(50));
		expect(fx.effect_snelle_momentum_rush(s, 'player_2').players.player_1.activeSlots[0].mp).toBe(50);
		expect(fx.effect_snelle_momentum_rush(s, 'player_2').players.player_2.activeSlots[0].mp).toBe(50);
	});
});

// ---------- quest worlds ----------
const phys = (id, over = {}) => mkSlot({ level: 3, mp: 60, subtype: 'PHYSICAL', levelAtTurnStart: 3, ...over }, m(id));
function world({ a = 'mosje_michelle', b = 'mosje_jeffrey', p1hand = [], p2hand = [], p2slots = null, grant = 0, deck = [], p2deck = [] } = {}) {
	const stacks = {};
	for (const id of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) stacks[id] = { deck: ['quest_x'], faceUp: 'quest_tough_it_out', tokens: 0, discard: [] };
	const s = makeEngineState({
		turnNumber: 5,
		questStacks: stacks,
		players: {
			player_1: { activeSlots: [phys(a), phys(b)], energy: 6, hand: p1hand, deck },
			player_2: { activeSlots: p2slots || [mkSlot({ mp: 40 }), null], energy: 6, hand: p2hand, deck: p2deck },
		},
	});
	if (grant) s.players.player_1.questDiceGrants = [{ amount: grant, lasts: 'thisTurn' }];
	return s;
}
const QUEST = (rng = () => 0.7, extra = {}) => ({ slotIndex: 0, stackId: 'PHYSICAL', rng, ...extra });
const PQ = (rng = () => 0.7) => ({ cardId: 'pq_charge', slotIndex: 0, rng });
const baseDice = (s) => rollQuestAttempt(s, 'player_1', QUEST(() => 0.7, { skipReactions: true })).pending.diceCount;
const basePqDice = (s) => rollPersonalQuestAttempt(s, 'player_1', { ...PQ(), skipReactions: true }).pending.diceCount;

// ---------- Oh nee toch niet ----------
describe('Oh nee toch niet (snelle_emergency_healings)', () => {
	const OH = 'snelle_emergency_healings';
	it('the data names the new moment', () => {
		expect(def(OH).reactionMoments).toEqual(['beforeOppQuestRoll']);
		expect(def(OH).description).toMatch(/1 die less/);
	});
	it('the other player is offered it before the dice are rolled; played, the roll has 1 die less', () => {
		const s = world({ p2hand: H(OH), grant: 2 });
		const base = baseDice(s);
		const w = rollQuestAttempt(s, 'player_1', QUEST());
		expect(w.pending).toBeUndefined();
		expect(w.state.pendingReaction.responderId).toBe('player_2');
		expect(w.state.pendingReaction.moments).toEqual(['beforeOppQuestRoll']);
		expect(w.state.pendingReaction.eligible).toContain(OH);
		const r = resolveReaction(w.state, 'player_2', OH);
		expect(r.state.pendingReaction).toBeUndefined();
		expect(r.pending.diceCount).toBe(base - 1);
		expect(r.pending.dice).toHaveLength(base - 1);
	});
	it('passing leaves the roll as it was', () => {
		const s = world({ p2hand: H(OH), grant: 2 });
		const w = rollQuestAttempt(s, 'player_1', QUEST());
		expect(resolveReaction(w.state, 'player_2', null).pending.diceCount).toBe(baseDice(s));
	});
	it('a roll of 1 die stays 1 die', () => {
		const s = world({ p2hand: H(OH) });
		expect(baseDice(s)).toBe(1);
		const w = rollQuestAttempt(s, 'player_1', QUEST());
		expect(resolveReaction(w.state, 'player_2', OH).pending.diceCount).toBe(1);
	});
	it('the die loss does not carry over to the next Quest of that turn', () => {
		const s = world({ p2hand: H(OH), grant: 2 });
		const r = resolveReaction(rollQuestAttempt(s, 'player_1', QUEST()).state, 'player_2', OH);
		expect((r.state.players.player_1.questDiceGrants || []).filter((g) => g.amount < 0)).toHaveLength(0);
		const next = rollQuestAttempt({ ...r.state, pendingQuestRoll: undefined }, 'player_1', QUEST(() => 0.7, { slotIndex: 1, skipReactions: true }));
		expect(next.pending.diceCount).toBe(baseDice(world()));
	});
	it('works on the opponent\'s Personal Quest roll too', () => {
		const s = world({ p1hand: H('pq_charge'), p2hand: H(OH), grant: 2 });
		const base = basePqDice(s);
		const w = rollPersonalQuestAttempt(s, 'player_1', PQ());
		expect(w.state.pendingReaction.moments).toEqual(['beforeOppQuestRoll']);
		expect(resolveReaction(w.state, 'player_2', OH).pending.diceCount).toBe(base - 1);
	});
	it('is not offered on the player\'s own Quest', () => {
		const s = world({ p1hand: H(OH) });
		expect(rollQuestAttempt(s, 'player_1', QUEST()).state.pendingReaction).toBeUndefined();
	});
	it('both players can react before a roll: both windows open and the roll happens once', () => {
		const s = world({ p1hand: H('snelle_sleutelpuntje'), p2hand: H(OH), grant: 2 });
		const base = baseDice(s);
		const w = rollQuestAttempt(s, 'player_1', QUEST());
		expect(w.state.pendingReaction.responderId).toBe('player_1');
		expect(w.state.pendingReaction.moments).toEqual(['beforeOwnQuestRoll']);
		const second = resolveReaction(w.state, 'player_1', 'snelle_sleutelpuntje');
		expect(second.state.pendingReaction.responderId).toBe('player_2');
		expect(second.state.pendingReaction.moments).toEqual(['beforeOppQuestRoll']);
		const r = resolveReaction(second.state, 'player_2', OH);
		expect(r.pending.diceCount).toBe(base); // +1 and -1 cancel out
		expect(r.state.players.player_1.questsAttemptedThisTurn).toBe(1);
		expect(r.state.players.player_1.activeSlots[0].actedThisTurn).toBe(true);
	});
});

// ---------- Chris's Handdoek ----------
describe("Chris's Handdoek (snelle_chriss_handdoek)", () => {
	const HD = 'snelle_chriss_handdoek';
	const chrisMp = (s, i = 0) => s.players.player_1.activeSlots[i].mp;
	it('the data names the window', () => {
		expect(def(HD).reactionMoments).toEqual(['afterOwnQuestRoll']);
	});
	it('after the player\'s own Quest roll it is offered; a Chris on the field gains 10 MP', () => {
		const s = world({ a: 'mosje_michelle', b: 'mosje_chris', p1hand: H(HD) });
		const w = rollQuestAttempt(s, 'player_1', QUEST());
		expect(w.state.pendingReaction.moments).toEqual(['afterOwnQuestRoll']);
		expect(w.state.pendingReaction.eligible).toContain(HD);
		const r = resolveReaction(w.state, 'player_1', HD);
		expect(r.state.pendingChoice ?? null).toBeNull(); // one die: nothing to pick
		expect(chrisMp(r.state, 1)).toBe(70); // also when another Mosje rolled
		expect(r.state.pendingQuestRoll.dice).toHaveLength(1);
	});
	it('without a Chris only the reroll happens', () => {
		const s = world({ p1hand: H(HD) });
		const r = resolveReaction(rollQuestAttempt(s, 'player_1', QUEST()).state, 'player_1', HD);
		expect(chrisMp(r.state, 0)).toBe(60);
		expect(chrisMp(r.state, 1)).toBe(60);
	});
	it('rerolls the one die the player picks and re-checks the win', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.01); // every reroll is a 1
		const s = world({ b: 'mosje_chris', p1hand: H(HD), grant: 1 });
		const w = rollQuestAttempt(s, 'player_1', QUEST(() => 0.7)); // two dice: 5 and 5, a win
		expect(w.state.pendingQuestRoll.dice).toEqual([5, 5]);
		const paused = resolveReaction(w.state, 'player_1', HD);
		expect(paused.state.pendingChoice.options.map((o) => o.die).sort()).toEqual([0, 1]);
		const done = resolvePendingChoice(paused.state, paused.state.pendingChoice.options.find((o) => o.die === 1));
		expect(done.state.pendingQuestRoll.dice).toEqual([5, 1]);
		expect(chrisMp(done.state, 1)).toBe(70);
		expect(done.state.pendingReaction).toBeUndefined();
	});
	it('a die index that is not in the options is refused', () => {
		const s = world({ p1hand: H(HD), grant: 1 });
		const paused = resolveReaction(rollQuestAttempt(s, 'player_1', QUEST()).state, 'player_1', HD);
		expect(resolvePendingChoice(paused.state, { label: 'Die 9', die: 9 }).ok).toBe(false);
	});
	it('is offered on a Personal Quest roll', () => {
		const w = rollPersonalQuestAttempt(world({ p1hand: H('pq_charge', HD) }), 'player_1', PQ());
		expect(w.state.pendingReaction.moments).toEqual(['afterOwnQuestRoll']);
		expect(w.state.pendingReaction.eligible).toContain(HD);
	});
	it('is not offered on the opponent\'s roll', () => {
		const w = rollQuestAttempt(world({ p2hand: H(HD) }), 'player_1', QUEST());
		expect(w.state.pendingReaction).toBeUndefined();
	});
});

// ---------- Ff Haaltje Nemen ----------
describe('Ff Haaltje Nemen (snelle_ff_haaltje_nemen)', () => {
	const FF = 'snelle_ff_haaltje_nemen';
	const deck = ['piecie_ronald_kip', 'piecie_kannetje_melk', 'piecie_afblijven'].map((cardId) => ({ cardId, type: 'PIECIE' }));
	it('costs 2 Energy and draws 1, also on the opponent\'s turn', () => {
		const s = world({ p2hand: H(FF), p2deck: deck });
		const r = playSnellie(s, 'player_2', { cardId: FF, type: 'SNELLE_PIECIE' }, def(FF));
		expect(r.success, r.error).toBe(true);
		const p = r.state.players.player_2;
		expect(p.energy).toBe(4);
		expect(p.hand.filter((c) => c.type !== 'SNELLE_PIECIE')).toHaveLength(1);
		expect(p.deck).toHaveLength(2);
	});
	it('an empty deck: nothing is drawn', () => {
		const out = fx.effect_snelle_ff_haaltje_nemen(world({ p2hand: H(FF) }), 'player_2');
		expect(out.players.player_2.hand).toHaveLength(1);
	});
});

// ---------- Lucky Coin ----------
describe('Lucky Coin (snelle_lucky_coin)', () => {
	const LC = 'snelle_lucky_coin';
	const creative = () => mkSlot({ mp: 40, subtype: 'CREATIVE' }, m('mosje_dj_8020'));
	const physArt = () => mkSlot({ mp: 40, subtype: 'PHYSICAL', traits: { artistic: 3 } }, m('mosje_michelle'));
	it('needs a Creative Mosje: a Physical Mosje with an Art star is not enough', () => {
		expect(snelleConditionMet(world({ p2slots: [physArt(), null] }), 'player_2', def(LC))).not.toBe(true);
		expect(snelleConditionMet(world({ p2slots: [creative(), null] }), 'player_2', def(LC))).toBe(true);
		expect(def(LC).needs).toEqual([{ kind: 'fieldMosjeType', type: 'CREATIVE' }]);
	});
	it('is offered after a Quest roll only with a Creative Mosje', () => {
		const no = rollQuestAttempt(world({ p2hand: H(LC), p2slots: [physArt(), null] }), 'player_1', QUEST());
		expect(no.state.pendingReaction).toBeUndefined();
		const yes = rollQuestAttempt(world({ p2hand: H(LC), p2slots: [creative(), null] }), 'player_1', QUEST());
		expect(yes.state.pendingReaction.eligible).toContain(LC);
	});
	const held = (dice, extra = {}) => ({ playerId: 'player_1', slotIndex: 0, stackId: 'PHYSICAL', questId: 'quest_tough_it_out', dice, diceCount: dice.length, win: true, ...extra });
	const lucky = (s) => fx.effect_snelle_lucky_coin(s, 'player_2', { reaction: { moments: ['afterQuestRoll'] } });
	it('its player picks which dice to reroll: some, each once; a pick of "Done" stops', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.01);
		const s = world({ p2slots: [creative(), null] });
		s.pendingQuestRoll = held([5, 5, 5]);
		s.players.player_2._pendingTargets = { coin_0: { die: 0 }, coin_1: { die: 2 }, coin_2: { done: true } };
		expect(lucky(s).pendingQuestRoll.dice).toEqual([1, 5, 1]);
	});
	it('none: the roll is untouched', () => {
		const s = world({ p2slots: [creative(), null] });
		s.pendingQuestRoll = held([5, 5]);
		s.players.player_2._pendingTargets = { coin_0: { done: true } };
		expect(lucky(s).pendingQuestRoll.dice).toEqual([5, 5]);
	});
	it('with an Art 3 Mosje the results are still rolled, not chosen', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.01);
		const s = world({ p2slots: [mkSlot({ mp: 40, subtype: 'CREATIVE', traits: { artistic: 3 } }, m('mosje_dj_8020')), null] });
		s.pendingQuestRoll = held([5, 5]);
		s.players.player_2._pendingTargets = { coin_0: { die: 1 }, coin_1: { done: true } };
		const out = lucky(s);
		expect(out.needChoice).toBeUndefined();
		expect(out.pendingQuestRoll.dice).toEqual([5, 1]);
	});
});

// ---------- Jensen! ----------
describe('Jensen! (snelle_jensen)', () => {
	const ready = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, canActivateOnTurn: 1 });
	const plain = m('mosje_ronald_chef');
	const slot = (d, mp, extra = {}) => Object.assign(createMosjeSlot(d, { level: 1, mp }), { entryProtected: false }, extra);
	function bintiBoard(p2Hand = H('snelle_jensen'), who = 'mosje_binti') {
		const s = makeEngineState({
			turnNumber: 3,
			players: {
				player_1: { activeSlots: [slot(m(who), 50), null], piecieSlots: [ready('piecie_kleine_taks'), null, null], energy: 4, hand: H('piecie_kannetje_melk') },
				player_2: { activeSlots: [slot(plain, 50, { traits: { mental: 2 } }), null], hand: p2Hand, energy: 6 },
			},
		});
		s._pendingTargets = { hand_card: 0, opp_slot_index: 0 };
		return s;
	}
	it('is not offered against Binti\'s Cutting Words', () => {
		const r = useMosjeAbility(bintiBoard(), 'player_1', 'mosje_binti');
		expect(r.success, r.error).toBe(true);
		expect(r.state.pendingReaction).toBeUndefined();
		expect(r.state.players.player_2.activeSlots[0].mp).toBe(40); // it resolved
	});
	it('is not offered against Ronald, Dr. Phill-osoof\'s ability', () => {
		const s = bintiBoard(H('snelle_jensen'), 'mosje_ronald_mastermind');
		s._pendingTargets = { opp_slot_index: 0 };
		const r = useMosjeAbility(s, 'player_1', 'mosje_ronald_mastermind');
		expect(r.success, r.error).toBe(true);
		expect(r.state.pendingReaction).toBeUndefined();
	});
	it('the Need says it reacts to a Piecie or Snelle', () => {
		const reason = snelleConditionMet(bintiBoard(), 'player_2', def('snelle_jensen'), { action: { type: 'mosjeAbility', args: [] }, actorId: 'player_1' });
		expect(reason).toMatch(/Piecie or Snelle/);
	});
});

// ---------- Je Weet Niet ----------
describe('Je Weet Niet (snelle_jeweetniet)', () => {
	const JW = 'snelle_jeweetniet';
	it('after the opponent\'s Quest roll every die is rerolled and the new roll stands', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.01);
		const w = rollQuestAttempt(world({ p2hand: H(JW), grant: 1 }), 'player_1', QUEST());
		expect(w.state.pendingReaction.moments).toEqual(['afterQuestRoll']);
		expect(w.state.pendingQuestRoll.win).toBe(true);
		const r = resolveReaction(w.state, 'player_2', JW);
		expect(r.state.pendingQuestRoll.dice).toEqual([1, 1]);
		expect(r.state.pendingQuestRoll.win).toBe(false);
	});
	it('also on a Personal Quest roll', () => {
		const w = rollPersonalQuestAttempt(world({ p1hand: H('pq_charge'), p2hand: H(JW) }), 'player_1', PQ());
		expect(w.state.pendingReaction.eligible).toContain(JW);
	});
	it('is not offered on the player\'s own roll', () => {
		expect(rollQuestAttempt(world({ p1hand: H(JW) }), 'player_1', QUEST()).state.pendingReaction).toBeUndefined();
	});
});

// ---------- Sleutelpuntje ----------
describe('Sleutelpuntje (snelle_sleutelpuntje)', () => {
	const SP = 'snelle_sleutelpuntje';
	it('before one of the player\'s own Quest rolls it adds 1 die to that roll', () => {
		const s = world({ p1hand: H(SP) });
		const base = baseDice(s);
		const w = rollQuestAttempt(s, 'player_1', QUEST());
		expect(w.state.pendingReaction.moments).toEqual(['beforeOwnQuestRoll']);
		expect(resolveReaction(w.state, 'player_1', SP).pending.diceCount).toBe(base + 1);
	});
	it('stays inside the 6-dice cap', () => {
		const s = world({ p1hand: H(SP), grant: 9 });
		const w = rollQuestAttempt(s, 'player_1', QUEST());
		expect(resolveReaction(w.state, 'player_1', SP).pending.diceCount).toBe(6);
	});
	it('is not offered on the opponent\'s roll', () => {
		expect(rollQuestAttempt(world({ p2hand: H(SP) }), 'player_1', QUEST()).state.pendingReaction).toBeUndefined();
	});
});
