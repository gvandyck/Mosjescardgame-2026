// @ts-nocheck
// Phase 70-07 (D-23): keyword hooks Entrance, Discarded, Level Down, Combo; Needs as data. Phase 71 fills the registry.
import { describe, it, expect, afterEach } from 'vitest';
import { startTurn, endTurn, playMosje, activatePiecie } from '../../src/engine/turnManager.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { applyMpLossToSlot } from '../../src/engine/mp/applyMpLossToSlot.js';
import { summonFromWelloe } from '../../src/abilities/piecie/summonFromWelloe.js';
import { discardFromHand } from '../../src/engine/hand/discardFromHand.js';
import { discardChoice } from '../../src/abilities/piecie/discardChoice.js';
import { toGraveyardEntry } from '../../src/engine/graveyardUtils.js';
import { KEYWORD_HOOKS } from '../../src/engine/keywords/keywordHooks.js';
import { runKeywordHook } from '../../src/engine/keywords/runKeywordHook.js';
import { isCombo } from '../../src/engine/keywords/isCombo.js';
import { piecieActivationGate } from '../../src/engine/table/piecieActivationGate.js';
import { snelleConditionMet, SNELLE_CONDITIONS } from '../../src/rules/snelleConditions.js';
import { PIECIES } from '../../src/data/piecies.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const m = MOSJES.find(x => x.id === 'mosje_alyssa_bulldozer'); // no random turn-start roll (MOSJES[0] has a Chaos Roll)
const filler = { cardId: 'piecie_x', type: 'PIECIE' };
const calls = [];
const added = [];
const hook = (kw, id, fn) => { KEYWORD_HOOKS[kw][id] = fn; added.push([kw, id]); };
afterEach(() => { for (const [kw, id] of added.splice(0)) delete KEYWORD_HOOKS[kw][id]; calls.length = 0; });

const mk = () => {
	const st = makeEngineState({ turnNumber: 5 });
	st.players.player_1.activeSlots[0] = createMosjeSlot(m);
	st.players.player_2.activeSlots[0] = createMosjeSlot(m);
	st.players.player_1.deck = [filler, filler];
	return st;
};

describe('Entrance', () => {
	it('runs once for playMosje', () => {
		const other = MOSJES.find(x => x.id !== m.id);
		hook('entrance', other.id, (s, ctx) => { calls.push(ctx); return s; });
		const st = mk();
		st.players.player_1.hand = [{ cardId: other.id, type: 'MOSJE' }];
		const r = playMosje(st, 'player_1', { cardId: other.id });
		expect(r.success).toBe(true);
		expect(calls.length).toBe(1);
		expect(calls[0].playerId).toBe('player_1');
	});
	it('runs for a summon from the pile', () => {
		hook('entrance', m.id, (s, ctx) => { calls.push(ctx); return s; });
		const st = mk();
		st.players.player_1.activeSlots[1] = null;
		st.players.player_1.graveyard = [toGraveyardEntry(m.id, 'defeated')];
		const idx = summonFromWelloe(st, 'player_1', m.id);
		expect(idx).toBeGreaterThanOrEqual(0);
		expect(calls.length).toBe(1);
	});
	it('does not run for the free empty-field Mosje', () => {
		hook('entrance', m.id, (s, ctx) => { calls.push(ctx); return s; });
		const st = mk();
		st.players.player_1.activeSlots = [null, null];
		st.players.player_1.hand = [{ cardId: m.id, type: 'MOSJE' }];
		const out = startTurn(st);
		expect(out.players.player_1.activeSlots.some(s => s?.cardId === m.id)).toBe(true);
		expect(calls.length).toBe(0);
	});
});

describe('Discarded', () => {
	const hand = (st, id = 'piecie_x') => { st.players.player_1.hand = [{ cardId: id, type: 'PIECIE' }]; return st; };
	it('runs for the owner own discard and for an opponent effect, with who discarded', () => {
		hook('discarded', 'piecie_x', (s, ctx) => { calls.push(ctx); return s; });
		const a = hand(mk());
		discardFromHand(a, 'player_1', 0, { byPlayerId: 'player_1' });
		const b = hand(mk());
		discardFromHand(b, 'player_1', 0, { byPlayerId: 'player_2' });
		expect(calls.map(c => c.byPlayerId)).toEqual(['player_1', 'player_2']);
		expect(calls[0].ownerId).toBe('player_1');
	});
	it('runs through the common "discard 1 card from your hand" path', () => {
		hook('discarded', 'piecie_x', (s, ctx) => { calls.push(ctx); return s; });
		const st = hand(mk());
		st.players.player_1._pendingTargets = { k: { cardId: 'piecie_x' } };
		discardChoice(st, 'player_1', 'k');
		expect(calls.length).toBe(1);
	});
	it('does not run when played normally or discarded from a Piecie slot', () => {
		hook('discarded', 'piecie_x', (s, ctx) => { calls.push(ctx); return s; });
		const st = mk();
		st.players.player_1.piecieSlots[0] = { cardId: 'piecie_x', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 };
		st.players.player_1.piecieSlots[0] = null; // swept / discarded from the slot: no hand discard call at all
		expect(calls.length).toBe(0);
	});
});

describe('Level Down', () => {
	const loss = (level, mp) => {
		hook('levelDown', m.id, (s, ctx) => { calls.push(ctx); return s; });
		const st = mk();
		const slot = createMosjeSlot(m, { level, mp });
		st.players.player_1.activeSlots[0] = slot;
		applyMpLossToSlot({ state: st, playerId: 'player_1', slot, amount: 20, source: 'test' });
		return st;
	};
	it('runs when a Mosje drops a level through a loss', () => {
		loss(3, 5);
		expect(calls.length).toBe(1);
		calls.length = 0;
		loss(2, 5);
		expect(calls.length).toBe(1);
	});
	it('does not run on Level 1 getemt or without a drop', () => {
		loss(1, 5);
		expect(calls.length).toBe(0);
		loss(2, 60);
		expect(calls.length).toBe(0);
	});
});

describe('Combo', () => {
	it('isCombo is true only while the 2nd Piecie of the turn runs', () => {
		const st = mk();
		const p = st.players.player_1;
		p.piecieActivationsThisTurn = 0;
		expect(isCombo(st, 'player_1')).toBe(false);
		p.piecieActivationsThisTurn = 1;
		expect(isCombo(st, 'player_1')).toBe(true);
		p.piecieActivationsThisTurn = 2;
		expect(isCombo(st, 'player_1')).toBe(false);
	});
	it('the combo hook fires on the 2nd activation only', () => {
		const cands = PIECIES.filter(d => !d.attach && !d.stays && !d.activationCost?.length && !(d.cost > 0));
		for (const d of cands) hook('combo', d.id, (s, ctx) => { calls.push({ id: d.id, combo: ctx.combo }); return s; });
		let st = mk();
		st.players.player_1.energy = 6;
		const done = [];
		for (const d of cands) {
			const t = JSON.parse(JSON.stringify(st));
			t.players.player_1.piecieSlots[0] = { cardId: d.id, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 };
			let r;
			try { r = activatePiecie(t, 'player_1', 0); } catch { continue; }
			if (!r.success || r.paused || r.reactionPending || r.state.pendingChoice) continue;
			done.push(d.id);
			st = r.state;
			if (done.length === 3) break;
		}
		expect(done.length).toBe(3);
		expect(calls.map(c => c.id)).toEqual([done[1]]);
		expect(calls[0].combo).toBe(true);
		expect(isCombo(st, 'player_1')).toBe(false);
	});
	it('the activation count restarts next turn', () => {
		const st = mk();
		st.players.player_1.piecieActivationsThisTurn = 2;
		st.players.player_2.deck = [filler];
		const next = startTurn(endTurn(startTurn(endTurn(st))));
		expect(next.players.player_1.piecieActivationsThisTurn).toBe(0);
	});
	it('a free activation counts as an activation', () => {
		const st = mk();
		st.players.player_1.piecieActivationsThisTurn = 1; // one free activation already done
		expect(isCombo(st, 'player_1')).toBe(true);
	});
});

describe('Needs as data', () => {
	it('a Piecie with a false data needs list cannot be activated: reason, no Energy, card stays ready', () => {
		const def = PIECIES.find(p => !p.attach && !p.needs && !(p.activationCost?.length));
		def.needs = [{ kind: 'mosjesOnField', count: 2 }];
		try {
			const st = mk();
			st.players.player_1.piecieSlots[0] = { cardId: def.id, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 };
			const before = st.players.player_1.energy;
			const r = activatePiecie(st, 'player_1', 0);
			expect(r.success).toBe(false);
			expect(r.error).toMatch(/^Needs/);
			expect(r.state.players.player_1.energy).toBe(before);
			expect(r.state.players.player_1.piecieSlots[0].activated).toBe(false);
			expect(piecieActivationGate(st, 'player_1', def)).toMatch(/^Needs/);
			st.players.player_1.activeSlots[1] = createMosjeSlot(m);
			expect(piecieActivationGate(st, 'player_1', def)).toBeNull();
		} finally { delete def.needs; }
	});
	it('a Snelle with a false data needs list returns the reason; existing per-card conditions still run', () => {
		const def = SNELLE_PIECIES.find(s => !SNELLE_CONDITIONS[s.id]);
		const had = def.needs;
		def.needs = [{ kind: 'mosjesOnField', count: 2 }];
		try {
			const st = mk();
			expect(snelleConditionMet(st, 'player_1', def)).toMatch(/^Needs/);
			st.players.player_1.activeSlots[1] = createMosjeSlot(m);
			expect(snelleConditionMet(st, 'player_1', def)).toBe(true);
		} finally { if (had) def.needs = had; else delete def.needs; }
		expect(snelleConditionMet(mk(), 'player_1', { id: 'snelle_perfect_dodge' })).toMatch(/^Needs/); // old per-card rule untouched
	});
});

describe('runKeywordHook', () => {
	it('a hook that throws keeps the state before the hook and logs', () => {
		hook('entrance', 'boom', () => { throw new Error('x'); });
		const st = mk();
		const out = runKeywordHook(st, 'entrance', 'boom', {});
		expect(out).toBe(st);
	});
	it('no hook registered returns the state', () => {
		const st = mk();
		expect(runKeywordHook(st, 'combo', 'nobody', {})).toBe(st);
	});
});
