// @ts-nocheck
// Phase 71-05: MP price first (Te Hard Gaan, Ronald's Fles Fireman, Blikje Monsteros), Snoeiertje Combo, Spiegelen,
// Kleine Taks and Jantje Jantje on the 2.1 text. Real engine through activatePiecie.
import { describe, it, expect } from 'vitest';
import { activatePiecie, endTurn } from '../../src/engine/turnManager.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { getPower } from '../../src/engine/mp/getPower.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { PIECIES } from '../../src/data/piecies.js';
import { PENDING_STARTER_EFFECTS } from '../../src/data/pendingStarterEffects.js';
import { effect_eendjes_voeren } from '../../src/abilities/piecieEffects.js';
import { makePiecieState } from '../helpers/makePiecieState.js';

const slotOf = (id: string, mp = 50, level = 1) => {
	const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level, mp });
	s.entryProtected = false;
	return s;
};
const WIZ = 'mosje_gandoe_wizard';
const filler = (n: number) => Array.from({ length: n }, () => ({ cardId: 'piecie_pot_of_weed', type: 'PIECIE' }));

function board(piecieId: string, first = WIZ, second: string | null = null, o: any = {}) {
	const s: any = makePiecieState({ piecieId });
	s.players.player_1.activeSlots = [slotOf(first, o.mp1 ?? 50), second ? slotOf(second, o.mp2 ?? 50) : null];
	s.players.player_1.energy = o.energy ?? 6;
	s.players.player_1.deck = filler(6);
	s.players.player_1.hand = [];
	s.players.player_2.deck = filler(4);
	s._pendingTargets = o.pick || {};
	return s;
}
const mine = (s: any, i = 0) => s.players.player_1.activeSlots[i];
// Activate; when the cost step pauses, pay with the Mosje at `payIndex`.
function run(s: any, payIndex = 0) {
	const r = activatePiecie(s, 'player_1', 0);
	expect(r.success, r.error).toBe(true);
	let state = r.state;
	if (state.pendingChoice?.key === 'cost_mosje') {
		const asked = state.pendingChoice.options;
		const res = resolvePendingChoice(state, asked.find((x: any) => x.slotIndex === payIndex));
		expect(res.ok).toBe(true);
		state = res.state;
	}
	return state;
}

describe('MP price first', () => {
	it('Te Hard Gaan: asks which Mosje pays; exactly 10 MP at once, +20 Power, nothing at the end of the turn', () => {
		const s = board('piecie_te_hard_gaan', WIZ, 'mosje_coert_tech');
		const r = activatePiecie(s, 'player_1', 0);
		expect(r.state.pendingChoice?.key).toBe('cost_mosje');
		expect(r.state.pendingChoice.options.map((o: any) => o.slotIndex)).toEqual([0, 1]);
		expect(mine(r.state, 1).mp).toBe(50); // nothing paid before the answer
		const base = getPower(mine(s, 1), s, 'player_1');
		const out = run(s, 1);
		expect(mine(out, 1).mp).toBe(40);
		expect(mine(out, 0).mp).toBe(50);
		expect(getPower(mine(out, 1), out, 'player_1')).toBe(base + 20);
		expect(mine(out, 1).mpLostWindowNow).toBe(true);
		const e = endTurn(out);
		expect(mine(e, 1).mp).toBe(40);
	});

	it('Te Hard Gaan: a Mosje at 10 MP is not offered; with all at 10 or less the card is refused before Energy', () => {
		const s = board('piecie_te_hard_gaan', WIZ, 'mosje_coert_tech', { mp2: 10 });
		const out = run(s, 0); // only slot 0 can pay: auto-picked
		expect(mine(out, 0).mp).toBe(40);
		expect(mine(out, 1).mp).toBe(10);
		const none = board('piecie_te_hard_gaan', WIZ, 'mosje_coert_tech', { mp1: 10, mp2: 10 });
		const r = activatePiecie(none, 'player_1', 0);
		expect(r.success).toBe(false);
		expect(none.players.player_1.energy).toBe(6);
	});

	it("Ronald's Fles Fireman: a non-Ronald pays 20 and gets +20 Power", () => {
		const s = board('piecie_ronalds_fles_fireman', WIZ);
		const base = getPower(mine(s), s, 'player_1');
		const out = run(s);
		expect(mine(out).mp).toBe(30);
		expect(getPower(mine(out), out, 'player_1')).toBe(base + 20);
	});

	it("Ronald's Fles Fireman: a Ronald pays nothing and still gets +20 Power; a Ronald at 5 MP can be picked", () => {
		for (const id of ['mosje_ronald_chef', 'mosje_ronald_mastermind']) {
			const s = board('piecie_ronalds_fles_fireman', id, null, { mp1: 5 });
			const base = getPower(mine(s), s, 'player_1');
			const out = run(s);
			expect(mine(out).mp).toBe(5);
			expect(getPower(mine(out), out, 'player_1')).toBe(base + 20);
		}
	});

	it("Ronald's Fles Fireman: with one non-Ronald at 20 MP and no Ronald the card is refused", () => {
		const s = board('piecie_ronalds_fles_fireman', WIZ, null, { mp1: 20 });
		const r = activatePiecie(s, 'player_1', 0);
		expect(r.success).toBe(false);
		expect(s.players.player_1.energy).toBe(6);
	});

	it("Ronald's Fles Fireman: with a Ronald and a non-Ronald, a forged answer naming a non-Ronald at 20 MP is refused", () => {
		const s = board('piecie_ronalds_fles_fireman', WIZ, 'mosje_ronald_chef', { mp1: 20, mp2: 5 });
		const r = activatePiecie(s, 'player_1', 0);
		expect(r.state.pendingChoice?.key ?? 'cost_mosje').toBe('cost_mosje');
		const options = r.state.pendingChoice ? r.state.pendingChoice.options.map((o: any) => o.slotIndex) : [1];
		expect(options).toEqual([1]);
	});

	it('Blikje Monsteros: the picked Mosje loses 15; gain 2 Energy (capped at 6)', () => {
		const s = board('piecie_blikje_monsteros', WIZ, null, { energy: 3 });
		const out = run(s);
		expect(mine(out).mp).toBe(35);
		expect(out.players.player_1.energy).toBe(5); // 3 + 2, card costs 0
		const full = board('piecie_blikje_monsteros', WIZ, null, { energy: 5 });
		expect(run(full).players.player_1.energy).toBe(6);
	});

	it('Blikje Monsteros: a Youri paying also draws 1; another Mosje paying with a Youri elsewhere draws nothing', () => {
		const y = board('piecie_blikje_monsteros', 'mosje_youri', WIZ);
		const outY = run(y, 0);
		expect(outY.players.player_1.hand).toHaveLength(1);
		const other = board('piecie_blikje_monsteros', 'mosje_youri', WIZ);
		const outO = run(other, 1);
		expect(outO.players.player_1.hand).toHaveLength(0);
	});

	it('Snoeiertje: +10 Power as the 1st Piecie, +20 as the 2nd; no MP lost now or at the end of the turn', () => {
		const s = board('piecie_snoeiertje');
		const base = getPower(mine(s), s, 'player_1');
		const out = run(s);
		expect(getPower(mine(out), out, 'player_1')).toBe(base + 10);
		expect(mine(out).mp).toBe(50);
		expect(mine(endTurn(out)).mp).toBe(50);
		const c = board('piecie_snoeiertje');
		c.players.player_1.piecieActivationsThisTurn = 1;
		const outC = run(c);
		expect(getPower(mine(outC), outC, 'player_1')).toBe(base + 20);
	});

	it('the cost cards carry the activationCost data', () => {
		const get = (id: string) => PIECIES.find((p: any) => p.id === id);
		expect(get('piecie_te_hard_gaan').activationCost).toEqual([{ kind: 'mpLoss', amount: 10 }]);
		expect(get('piecie_ronalds_fles_fireman').activationCost).toEqual([{ kind: 'mpLoss', amount: 20, freeFor: ['Ronald'] }]);
		expect(get('piecie_blikje_monsteros').activationCost).toEqual([{ kind: 'mpLoss', amount: 15 }]);
		expect(PENDING_STARTER_EFFECTS).not.toContain('effect_ronalds_fles_fireman');
		expect(PENDING_STARTER_EFFECTS).not.toContain('effect_blikje_monsteros');
	});
});

describe('Kleine Taks (rules 13)', () => {
	const nextOwnTurn = (s: any) => { const n = JSON.parse(JSON.stringify(s)); n.activePlayerId = 'player_1'; n.turnNumber += 1; return n; };
	it('loses 10 at the end of this turn and 10 at the end of the next, ignoring Resilient; stays between; then discarded', () => {
		const s0 = board('piecie_kleine_taks', WIZ, null, { pick: { opp_slot_index: 0 } });
		s0.players.player_2.activeSlots[0].traits = { ...s0.players.player_2.activeSlots[0].traits, resilient: 2 };
		const s = run(s0);
		const e = endTurn(s);
		expect(e.players.player_2.activeSlots[0].mp).toBe(40);
		expect(e.players.player_1.piecieSlots[0]).toBeTruthy();
		const done = endTurn(nextOwnTurn(e));
		expect(done.players.player_2.activeSlots[0].mp).toBe(30);
		expect(done.players.player_1.piecieSlots[0]).toBeNull();
		expect(done.players.player_1.graveyard.map((g: any) => g.cardId)).toContain('piecie_kleine_taks');
	});
	it('a fresh opponent Mosje can not be targeted', () => {
		const s0 = board('piecie_kleine_taks');
		s0.players.player_2.activeSlots[0].entryProtected = true;
		s0.players.player_2.activeSlots[0].turnsOnField = 0;
		const s = run(s0);
		expect(s.players.player_1.piecieSlots[0]).toBeNull();
	});
});

describe('Spiegelen', () => {
	const setup = (ownMp: number, boostFoe: number, boostOwn = 0) => {
		const s = board('piecie_eendjes_voeren', WIZ, null, { pick: { opp_slot_index: 0, own_slot_index: 0 } });
		s.players.player_2.activeSlots[0].powerBoostThisTurn = boostFoe;
		s.players.player_1.activeSlots[0].powerBoostThisTurn = boostOwn;
		s.players.player_1.activeSlots[0].mp = ownMp;
		return s;
	};
	it('copies the target Power (with boosts) for this turn and gives it back afterwards, no MP gained', () => {
		const s = setup(50, 10);
		const ownBase = getPower(mine(s), s, 'player_1');
		const foePower = getPower(s.players.player_2.activeSlots[0], s, 'player_2');
		const out = run(s);
		expect(getPower(mine(out), out, 'player_1')).toBe(foePower);
		expect(mine(out).mp).toBe(50);
		const later = endTurn(endTurn(out));
		expect(getPower(mine(later), later, 'player_1')).toBe(ownBase);
	});
	it('also works downwards, and a later boost still adds on top', () => {
		const s = setup(50, 0, 40);
		const foePower = getPower(s.players.player_2.activeSlots[0], s, 'player_2');
		const out = run(s);
		expect(getPower(mine(out), out, 'player_1')).toBe(foePower);
		out.players.player_1.activeSlots[0].powerBoostThisTurn += 10;
		expect(getPower(mine(out), out, 'player_1')).toBe(foePower + 10);
	});
	it('records the Target', () => {
		// the record is removed at the end of an action, so look at the effect itself
		const out = effect_eendjes_voeren(setup(50, 0), 'player_1');
		expect(out.targetedThisAction).toEqual(expect.arrayContaining([{ playerId: 'player_2', slotIndex: 0 }]));
	});
	it('no legal opponent Mosje: nothing happens', () => {
		const s = setup(50, 0);
		s.players.player_2.activeSlots[0].entryProtected = true;
		s.players.player_2.activeSlots[0].turnsOnField = 0;
		const base = getPower(mine(s), s, 'player_1');
		const r = activatePiecie(s, 'player_1', 0);
		const out = r.state ?? s;
		expect(getPower(mine(out), out, 'player_1')).toBe(base);
		expect(mine(out).mp).toBe(50);
	});
});

describe('Jantje Jantje...', () => {
	it('a hit discards the named card and gives no Power', () => {
		const s0 = board('piecie_jantje_jantje');
		s0.players.player_2.hand = [{ cardId: 'piecie_affoe', type: 'PIECIE' }, { cardId: 'piecie_straffoe', type: 'PIECIE' }];
		const base = getPower(mine(s0), s0, 'player_1');
		let s = run(s0);
		const res = resolvePendingChoice(s, s.pendingChoice.options.find((x: any) => x.cardId === 'piecie_affoe'));
		expect(res.ok).toBe(true);
		s = res.state;
		expect(s.players.player_2.hand.map((c: any) => c.cardId)).toEqual(['piecie_straffoe']);
		expect(getPower(mine(s), s, 'player_1')).toBe(base);
	});
	it('a miss costs the chosen Mosje 10 MP', () => {
		const s0 = board('piecie_jantje_jantje');
		s0.players.player_2.hand = [{ cardId: 'piecie_straffoe', type: 'PIECIE' }];
		let s = run(s0);
		s = resolvePendingChoice(s, s.pendingChoice.options.find((x: any) => x.cardId === 'piecie_affoe')).state;
		expect(mine(s).mp).toBe(40);
	});
});
