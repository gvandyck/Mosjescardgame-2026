/**
 * Smoke test: offline game runs to completion without crashing.
 * Verifies that driveBotTurn + the engine can reach FINISHED within 60 turns.
 *
 * NOTE: Test file uses .ts extension (vitest.config.ts only picks up tests/**\/*.ts).
 * The source files remain .js as specified by the plan.
 */
import { describe, it, expect } from 'vitest';

// @ts-expect-error JS module without type declarations
import { createInitialGameState } from '../../src/engine/gameState.js';
// @ts-expect-error JS module without type declarations
import { startTurn, endTurn } from '../../src/engine/turnManager.js';
// @ts-expect-error JS module without type declarations
import { driveBotTurn } from '../../src/bot/botDriver.js';

const MAX_TURNS = 60;

interface GameState {
  status: string;
  winnerId: string | null;
  players: {
    player_1: { activeSlots: unknown[] };
    player_2: { activeSlots: unknown[] };
  };
}

function runOfflineGame(p1DeckId: string, p2DeckId: string): GameState {
  const players = [
    { playerId: 'player_1', name: 'Human', deckId: p1DeckId },
    { playerId: 'player_2', name: 'Bot',   deckId: p2DeckId },
  ];
  let state: GameState = createInitialGameState(players, 'OFFLINE_TEST');
  state = startTurn(state);

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    if (state.status === 'FINISHED') break;

    const active = (state as unknown as { activePlayerId: string }).activePlayerId;

    if (active === 'player_2') {
      // Bot drives its own full turn (includes endTurn internally)
      state = driveBotTurn(state, 'player_2');
      if (state.status === 'FINISHED') break;
      // Start the next turn (human draw phase)
      state = startTurn(state);
    } else {
      // Human: end turn immediately (no actions) then start bot's turn
      state = endTurn(state);
      if (state.status === 'FINISHED') break;
      state = startTurn(state);
    }
  }

  return state;
}

describe('Offline game smoke test', () => {
  it('PHYSICAL_FORCE vs DIGITAL_CONTROL completes within 60 turns', () => {
    let finalState: GameState | undefined;
    expect(() => {
      finalState = runOfflineGame('PHYSICAL_FORCE', 'DIGITAL_CONTROL');
    }).not.toThrow();
    expect(finalState!.status).toBe('FINISHED');
    expect(['player_1', 'player_2']).toContain(finalState!.winnerId);
  });

  it('ARTISTIC_RHYTHM vs PHYSICAL_FORCE completes within 60 turns', () => {
    let finalState: GameState | undefined;
    expect(() => {
      finalState = runOfflineGame('ARTISTIC_RHYTHM', 'PHYSICAL_FORCE');
    }).not.toThrow();
    expect(finalState!.status).toBe('FINISHED');
    expect(['player_1', 'player_2']).toContain(finalState!.winnerId);
  });

  it('game state integrity: no player loses their activeSlots array', () => {
    const finalState = runOfflineGame('DIGITAL_CONTROL', 'ARTISTIC_RHYTHM');
    expect(Array.isArray(finalState.players.player_1.activeSlots)).toBe(true);
    expect(Array.isArray(finalState.players.player_2.activeSlots)).toBe(true);
  });
});
