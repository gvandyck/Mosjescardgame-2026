/**
 * Smoke test: offline game runs to completion without crashing.
 * Verifies that driveBotTurn + the engine can reach FINISHED within 60 turns.
 *
 * NOTE: Test file uses .ts extension (vitest.config.ts only picks up tests/**\/*.ts).
 * The source files remain .js as specified by the plan.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Determinism: the engine uses Math.random() for dice + deck shuffles, so an unseeded
// game plays differently every run and this smoke suite was flaky (a random game might
// not reach FINISHED within the turn cap). Reuse the same Math.random-override pattern as
// the Playwright mockDiceRoll helper, but with a SEEDED generator (a constant breaks the
// shuffle). mulberry32 gives a fixed, varied sequence → the same game plays every run.
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let _origRandom: () => number;
beforeEach(() => { _origRandom = Math.random; Math.random = mulberry32(0xC0FFEE); });
afterEach(() => { Math.random = _origRandom; });

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

  // Regression for the deck-out hang: with tiny decks both players deck-out early
  // and get skipNextTurn set repeatedly. A skipped startTurn must keep advancing to a
  // properly-started turn so the loop reaches FINISHED instead of stalling. (Before the
  // fix, startTurn returned an un-started, un-routed turn — offline play froze.)
  it('reaches FINISHED even when both players repeatedly deck-out (skip turns)', () => {
    const players = [
      { playerId: 'player_1', name: 'Human', deckId: 'PHYSICAL_FORCE' },
      { playerId: 'player_2', name: 'Bot',   deckId: 'DIGITAL_CONTROL' },
    ];
    let state: any = createInitialGameState(players, 'DECKOUT_TEST');
    // Trim both decks to 3 cards so deck-out (and the skip path) triggers within a few turns.
    state.players.player_1.deck = state.players.player_1.deck.slice(0, 3);
    state.players.player_2.deck = state.players.player_2.deck.slice(0, 3);
    state = startTurn(state);

    let sawSkipFlag = false;
    expect(() => {
      for (let turn = 0; turn < 120; turn++) {
        if (state.status === 'FINISHED') break;
        if (state.players.player_1.skipNextTurn || state.players.player_2.skipNextTurn) {
          sawSkipFlag = true;
        }
        const active = state.activePlayerId;
        if (active === 'player_2') {
          state = driveBotTurn(state, 'player_2');
        } else {
          state = endTurn(state);
        }
        if (state.status === 'FINISHED') break;
        // startTurn must always hand back a properly-started, correctly-routed turn —
        // even when it has to skip a deck-out player.
        state = startTurn(state);
        expect(['player_1', 'player_2']).toContain(state.activePlayerId);
      }
    }).not.toThrow();

    expect(sawSkipFlag).toBe(true);     // the deck-out skip path was actually exercised
    expect(state.status).toBe('FINISHED'); // and the game terminated rather than hanging
  });
});
