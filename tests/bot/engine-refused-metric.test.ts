// @ts-nocheck
// 61.1 D-03a: the `engine-refused` metric also covers the bot's silent refusal paths (found in the Phase 61 verification, W2):
//  - settleMosjePauses: a refused resolvePendingChoice, a refused finishDrawStep
//  - settleReactions: the second failure (even the pass is refused)
// The two Mosje-pause engine calls are mocked so they refuse deterministically (finishDrawStep never refuses as the driver calls it).
// The reaction case uses the real resolveReaction: a held activation of an empty Piecie slot fails even for a pass.
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/engine/mosje/resolvePendingChoice.js', () => ({
	resolvePendingChoice: (state) => ({ ok: false, success: false, state, error: 'mock refusal' }),
}));
vi.mock('../../src/engine/mosje/finishDrawStep.js', () => ({
	finishDrawStep: (state) => ({ ok: false, success: false, state, error: 'mock refusal' }),
}));

import { createInitialGameState } from '../../src/engine/gameState.js';
import { settleMosjePauses } from '../../src/bot/settleMosjePauses.js';
import { settleReactions } from '../../src/bot/settleReactions.js';
import { captureBotMetrics } from '../helpers/captureBotMetrics.js';

const table = () => createInitialGameState([
	{ playerId: 'player_1', name: 'BotA', deckId: 'EXAMPLE_TAKSEN' },
	{ playerId: 'player_2', name: 'BotB', deckId: 'EXAMPLE_REGELAARS' },
], 'ENGINE_REFUSED_METRIC', { firstPlayerId: 'player_1' });
const refused = (metrics) => metrics.filter((m) => m.ev === 'engine-refused');

describe('engine-refused covers the silent settle paths (61.1 D-03a)', () => {
	it('a refused resolvePendingChoice emits engine-refused and drops the choice', () => {
		const state = { ...table(), pendingChoice: { playerId: 'player_2', hook: 'trigger', key: 'refused_key', choiceKind: 'mosje', options: [{ slotIndex: 0 }] } };
		const { result, metrics } = captureBotMetrics(() => settleMosjePauses(state, []));
		expect(refused(metrics)).toEqual([{ ev: 'engine-refused', call: 'resolvePendingChoice', cardId: 'refused_key', error: 'mock refusal' }]);
		expect(result.state.pendingChoice).toBeUndefined();
		expect(result.waiting).toBe(false);
	});

	it('a refused finishDrawStep emits engine-refused and drops the draw step', () => {
		const state = { ...table(), pendingDrawStep: { playerId: 'player_2', options: [] } };
		const { result, metrics } = captureBotMetrics(() => settleMosjePauses(state, []));
		expect(refused(metrics)).toEqual([{ ev: 'engine-refused', call: 'finishDrawStep', cardId: null, error: 'mock refusal' }]);
		expect(result.state.pendingDrawStep).toBeUndefined();
		expect(result.waiting).toBe(false);
	});

	it('a pass that is itself refused emits a second engine-refused and drops the window', () => {
		const state = {
			...table(),
			pendingReaction: {
				id: 'r1', responderId: 'player_2', actorId: 'player_1', moments: ['attacked'], eligible: [], queue: [],
				preview: { getemt: [], toWelloe: false, mpLoss: {} },
				action: { type: 'activatePiecie', args: ['player_1', 0] }, // player_1 has no Piecie in slot 0: the replay fails even for a pass
			},
		};
		const { result, metrics } = captureBotMetrics(() => settleReactions(state, []));
		const calls = refused(metrics);
		expect(calls.length).toBeGreaterThanOrEqual(2);
		expect(calls.every((m) => m.call === 'resolveReaction')).toBe(true);
		expect(calls[calls.length - 1].cardId).toBeNull();
		expect(result.state.pendingReaction).toBeUndefined();
		expect(result.waiting).toBe(false);
	});
});
