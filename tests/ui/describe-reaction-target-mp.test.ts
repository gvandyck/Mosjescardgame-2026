// describeReactionTargetMp (72.1-12): the phone reaction sheet names the attacked Mosje and its current MP.
import { describe, it, expect } from 'vitest';
import { describeReactionTargetMp } from '../../src/ui/board/describeReactionTargetMp.js';

const state = (mp: unknown, type = 'attack') => ({
	pendingReaction: { action: { type, args: ['player_2', { attackerSlotIndex: 0, targetPlayerId: 'player_1', targetSlotIndex: 0 }] } },
	players: { player_1: { activeSlots: [{ name: 'Alyssa, The Bulldozer', mp }] } },
});

describe('describeReactionTargetMp', () => {
	it('states the first name and the current MP of the attacked Mosje', () => {
		expect(describeReactionTargetMp(state(60))).toBe('Alyssa has 60 MP.');
	});
	it('returns an empty string for a non-attack window, no window or a missing target', () => {
		expect(describeReactionTargetMp(state(60, 'quest'))).toBe('');
		expect(describeReactionTargetMp({ players: {} })).toBe('');
		expect(describeReactionTargetMp(undefined)).toBe('');
		expect(describeReactionTargetMp(state('x'))).toBe('');
		const s = state(60);
		s.players.player_1.activeSlots = [];
		expect(describeReactionTargetMp(s)).toBe('');
	});
});
