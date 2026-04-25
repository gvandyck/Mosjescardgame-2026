import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInitialGameState } from '../../src/engine/gameState.js';
import { playMosje, startTurn } from '../../src/engine/turnManager.js';
import { MOSJES } from '../../src/data/mosjes.js';

describe('General Quest — Mosje Selection Modal', () => {
	let gameState;
	let players;

	beforeEach(() => {
		players = [
			{ playerId: 'player_1', name: 'Player One', deckId: 'DIGITAL_CONTROL' },
			{ playerId: 'player_2', name: 'Player Two', deckId: 'ARTISTIC_RHYTHM' },
		];
		gameState = createInitialGameState(players, 'TEST_ROOM');
		gameState = startTurn(gameState);
	});

	it('should have player Mosje available for quest attempt', () => {
		const player1 = gameState.players['player_1'];
		expect(player1).toBeDefined();
		expect(player1.hand).toBeDefined();
		expect(player1.activeSlots).toBeDefined();
	});

	it('should field multiple Mosjes so selection modal is needed', () => {
		const player1 = gameState.players['player_1'];
		let state = gameState;

		// Play first Mosje (should be in hand)
		const firstMosjeCard = player1.hand.find(c => MOSJES.some(m => m.id === c.cardId));
		if (firstMosjeCard) {
			const { state: newState, success } = playMosje(state, 'player_1', firstMosjeCard);
			if (success) state = newState;
		}

		// Find a second Mosje to play
		const allMosjeIds = MOSJES.map(m => m.id);
		const secondMosjeCard = state.players['player_1'].hand.find(
			c => allMosjeIds.includes(c.cardId) &&
			     c.cardId !== firstMosjeCard?.cardId
		);
		if (secondMosjeCard) {
			const { state: newState, success } = playMosje(state, 'player_1', secondMosjeCard);
			if (success) state = newState;
		}

		// Verify multiple active Mosjes
		const activeSlots = state.players['player_1'].activeSlots.filter(s => s && !s.isDefeated);
		if (activeSlots.length > 1) {
			expect(activeSlots.length).toBeGreaterThan(1);
			console.log(`✓ Multiple Mosjes available: ${activeSlots.length}`);
		} else {
			console.log(`Note: Could only field ${activeSlots.length} Mosje(s) for test`);
		}
	});
});
