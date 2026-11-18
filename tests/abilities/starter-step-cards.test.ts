// @ts-nocheck
// Phase 71-02: the first real cards on the step handler - numbers unchanged from before.
import { describe, it, expect } from 'vitest';
import { CARD_STEPS } from '../../src/rules/cardSteps.js';
import { activatePiecie, endTurn } from '../../src/engine/turnManager.js';
import { getPower } from '../../src/engine/mp/getPower.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { makePiecieState } from '../helpers/makePiecieState.js';

const board = (piecieId: string, mp = 20) => {
	const s: any = makePiecieState({ piecieId, own: { mp } });
	s.players.player_1.energy = 6;
	s.players.player_1.deck = [{ cardId: 'piecie_pot_of_weed', type: 'PIECIE' }];
	s._pendingTargets = {};
	return s;
};
const run = (s: any) => {
	const r = activatePiecie(s, 'player_1', 0);
	expect(r.success, r.error).toBe(true);
	return r.state;
};

describe('the step table', () => {
	it('has the two proof cards as data', () => {
		expect(CARD_STEPS.piecie_kannetje_melk).toEqual([{ do: 'gainMp', amount: 25 }]);
		expect(CARD_STEPS.piecie_super_saiyan_mos).toEqual([{ do: 'power', amount: 30, duration: 'thisTurn' }]);
	});
	it('every step names a registered kind', async () => {
		const { STEP_KINDS } = await import('../../src/engine/steps/stepKinds.js');
		for (const [id, steps] of Object.entries(CARD_STEPS)) for (const st of steps as any[]) expect(STEP_KINDS[st.do], `${id}: ${st.do}`).toBeTruthy();
	});
});

describe('Kannetje Melk and Super Saiyan Mos through runPiecieEffect', () => {
	it('Kannetje Melk: a Mosje on 20 MP gets 45', () => {
		expect(run(board('piecie_kannetje_melk')).players.player_1.activeSlots[0].mp).toBe(45);
	});
	it('Super Saiyan Mos: +30 Power this turn, gone at the end of the turn', () => {
		const s = board('piecie_super_saiyan_mos');
		const slot = s.players.player_1.activeSlots[0];
		const base = getPower(slot, s, 'player_1');
		let out = run(s);
		expect(getPower(out.players.player_1.activeSlots[0], out, 'player_1')).toBe(base + 30);
		out = endTurn(out);
		expect(getPower(out.players.player_1.activeSlots[0], out, 'player_1')).toBe(base);
	});
});
