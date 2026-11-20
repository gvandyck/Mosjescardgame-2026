// @ts-nocheck
// Binti's Cutting Words targets an opponent Mosje, so a Blensen! shield that is up this turn refuses it
// (rules §9: Blensen! acts on anything that says Target). Found by the Phase 71 verifier.
import { describe, expect, it } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { useMosjeAbility } from '../../src/engine/turnManager.js';

const BINTI = MOSJES.find((m: any) => m.id === 'mosje_binti');
const card = (cardId: string, type = 'PIECIE') => ({ cardId, type });

const board = () => {
	const s = makeEngineState({
		turnNumber: 5,
		players: {
			player_1: { energy: 4, hand: [card('piecie_kannetje_melk')], deck: Array.from({ length: 12 }, () => card('piecie_kannetje_melk')), activeSlots: [mkSlot({ mp: 30, level: 1 }, BINTI), null] },
			player_2: { hand: [card('piecie_ronald_kip')], activeSlots: [mkSlot({ mp: 60 }), mkSlot({ mp: 60 })] },
		},
	});
	s._pendingTargets = { hand_card: 0, opp_slot_index: 0 };
	return s;
};

describe('Binti, The Sharp Tongue vs Blensen!', () => {
	it('with the opponent shielded this turn the ability is refused and nothing is paid', () => {
		const s = board();
		s.blensenShield = { playerId: 'player_2', turnNumber: s.turnNumber };
		const r = useMosjeAbility(s, 'player_1', 'mosje_binti');
		expect(r.success).toBe(false);
		expect(s.players.player_1.energy).toBe(4);
	});
	it('an old shield from an earlier turn does not stop her', () => {
		const s = board();
		s.blensenShield = { playerId: 'player_2', turnNumber: s.turnNumber - 2 };
		const r = useMosjeAbility(s, 'player_1', 'mosje_binti');
		expect(r.success, r.error).toBe(true);
		expect(r.state.players.player_2.activeSlots[0].mp).toBe(50);
	});
});
