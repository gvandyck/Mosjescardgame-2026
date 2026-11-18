// @ts-nocheck
// Phase 71-03: the starter food Piecies on the 2.1 text, run on the real engine through activatePiecie.
import { describe, it, expect } from 'vitest';
import { activatePiecie, endTurn } from '../../src/engine/turnManager.js';
import { getPower } from '../../src/engine/mp/getPower.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { makePiecieState } from '../helpers/makePiecieState.js';

const slotOf = (id: string, mp = 20, level = 1) => {
	const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level, mp });
	s.entryProtected = false;
	return s;
};
const card = (i: number) => ({ cardId: 'piecie_pot_of_weed', type: 'PIECIE', i });

// player_1: slot 0 = `first`, slot 1 = `second` (optional); one ready copy of the Piecie.
function board(piecieId: string, first: string, second: string | null = null, deck = 3) {
	const s: any = makePiecieState({ piecieId });
	s.players.player_1.activeSlots = [slotOf(first), second ? slotOf(second, 50) : null];
	s.players.player_1.energy = 6;
	s.players.player_1.deck = Array.from({ length: deck }, (_, i) => card(i));
	s.players.player_1.hand = [];
	s._pendingTargets = {};
	return s;
}
const run = (s: any) => {
	const r = activatePiecie(s, 'player_1', 0);
	expect(r.success, r.error).toBe(true);
	return r.state;
};
const mine = (s: any, i = 0) => s.players.player_1.activeSlots[i];

describe('Late Night Doner', () => {
	it('gives +10 Power until the end of your next turn and no MP', () => {
		const s = board('piecie_broodje_doner', 'mosje_coert_tech');
		const base = getPower(mine(s), s, 'player_1');
		let out = run(s);
		expect(mine(out).mp).toBe(20);
		expect(getPower(mine(out), out, 'player_1')).toBe(base + 10);
		out = endTurn(out); // the opponent's turn
		expect(getPower(mine(out), out, 'player_1')).toBe(base + 10);
		out = endTurn(out); // the owner's next turn
		expect(getPower(mine(out), out, 'player_1')).toBe(base + 10);
		out = endTurn(out); // ends it
		expect(getPower(mine(out), out, 'player_1')).toBe(base);
	});
});

describe('Protein Shake', () => {
	it('is refused with the Need as the reason when no Physical Mosje is on the field, nothing paid', () => {
		const s = board('piecie_protein_shake', 'mosje_coert_tech');
		const r = activatePiecie(s, 'player_1', 0);
		expect(r.success).toBe(false);
		expect(String(r.error)).toMatch(/Physical/i);
		expect(r.state?.players?.player_1?.energy ?? 6).toBe(6);
	});
	it('with a Physical Mosje on the field any own Mosje gains 30 (also a Digital one)', () => {
		const s = board('piecie_protein_shake', 'mosje_coert_tech', 'mosje_alyssa_bulldozer');
		expect(mine(run(s)).mp).toBe(50);
	});
});

describe('Ronald Kip', () => {
	it('alone: +40, no draw', () => {
		const out = run(board('piecie_ronald_kip', 'mosje_coert_tech', null));
		expect(mine(out).mp).toBe(60);
		expect(out.players.player_1.hand).toHaveLength(0);
	});
	it('with Ronald, The Master Chef: +40 and draw 1', () => {
		const out = run(board('piecie_ronald_kip', 'mosje_coert_tech', 'mosje_ronald_chef'));
		expect(mine(out).mp).toBe(60);
		expect(out.players.player_1.hand).toHaveLength(1);
	});
	it('with Ronald, Dr. Phill-osoof: also draw 1', () => {
		const out = run(board('piecie_ronald_kip', 'mosje_coert_tech', 'mosje_ronald_mastermind'));
		expect(out.players.player_1.hand).toHaveLength(1);
	});
	it('with a Ronald and an empty deck: +40, no draw, no error', () => {
		const out = run(board('piecie_ronald_kip', 'mosje_coert_tech', 'mosje_ronald_chef', 0));
		expect(mine(out).mp).toBe(60);
		expect(out.players.player_1.hand).toHaveLength(0);
	});
});

describe('Hawaii Pizza', () => {
	it('gives 30 MP, no draw without a Coert', () => {
		const out = run(board('piecie_hawaii_pizza', 'mosje_alyssa_bulldozer'));
		expect(mine(out).mp).toBe(50);
		expect(out.players.player_1.hand).toHaveLength(0);
	});
	it('with Coert, The Hawaiian Tech Savant on the field: draw 1; the gain may go to another Mosje', () => {
		const out = run(board('piecie_hawaii_pizza', 'mosje_alyssa_bulldozer', 'mosje_coert_tech'));
		expect(mine(out).mp).toBe(50);
		expect(out.players.player_1.hand).toHaveLength(1);
	});
	it('with FPS Coert on the field: draw 1', () => {
		const out = run(board('piecie_hawaii_pizza', 'mosje_alyssa_bulldozer', 'mosje_fps_coert'));
		expect(out.players.player_1.hand).toHaveLength(1);
	});
});

describe('Varkenspootjes', () => {
	const target = (s: any, playerId: string, slotIndex: number) => {
		s._pendingTargets = { any_target: { playerId, slotIndex } };
		return s;
	};
	it('a Binti gains 40', () => {
		const s = target(board('piecie_varkenspootjes', 'mosje_binti'), 'player_1', 0);
		expect(mine(run(s)).mp).toBe(60);
	});
	it("an opponent's Binti gains 40 too", () => {
		const s = board('piecie_varkenspootjes', 'mosje_alyssa_bulldozer');
		s.players.player_2.activeSlots[0] = slotOf('mosje_binti', 20);
		const out = run(target(s, 'player_2', 0));
		expect(out.players.player_2.activeSlots[0].mp).toBe(60);
	});
	it('any other Mosje loses 15', () => {
		const s = target(board('piecie_varkenspootjes', 'mosje_alyssa_bulldozer'), 'player_1', 0);
		expect(mine(run(s)).mp).toBe(5);
	});
});
