import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../../src/engine/gameState.js';
import { startTurn, endTurn } from '../../src/engine/turnManager.js';
import { rollOpeningDice } from '../../src/engine/setup/rollOpeningDice.js';
import { buildQuestStacks } from '../../src/engine/setup/buildQuestStacks.js';
import { QUESTS } from '../../src/data/quests.js';
import { EXAMPLE_DECKS } from '../../src/data/exampleDecks.js';

const deck = EXAMPLE_DECKS[0];
const configs = [
  { playerId: 'p1', name: 'A', deckId: deck.id },
  { playerId: 'p2', name: 'B', deckId: deck.id },
];
const make = (opts: any = { firstPlayerId: 'p1' }) => createInitialGameState(configs, 'T', opts);

describe('2.0 setup', () => {
  it('starting Mosje on field level 1 fresh, 3 cards, 2 Energy, one copy removed', () => {
    const s = make();
    for (const id of ['p1', 'p2']) {
      const p = s.players[id];
      const slots = p.activeSlots.filter(Boolean);
      expect(slots).toHaveLength(1);
      expect(slots[0].cardId).toBe(deck.startingMosje);
      expect(slots[0].level).toBe(1);
      expect(slots[0].entryProtected).toBe(true);
      expect(p.hand).toHaveLength(3);
      expect(p.energy).toBe(2);
      expect(p.deck.length + p.hand.length + slots.length).toBe(30);
    }
    expect(s.firstTurnDrawSkipPending).toBe(true);
  });

  it('builds 3 typed quest stacks with a face-up top', () => {
    const s = make();
    for (const t of ['FIGHTING', 'DIGITAL', 'ARTISTIC']) {
      const st = s.questStacks[t];
      const total = QUESTS.filter((q: any) => q.stack === t).length;
      expect(QUESTS.find((q: any) => q.id === st.faceUp).stack).toBe(t);
      expect(st.deck.length).toBe(total - 1);
      expect(st.tokens).toBe(0);
      expect(st.discard).toEqual([]);
    }
    expect(buildQuestStacks([], (a: any) => a).FIGHTING.faceUp).toBeNull();
  });

  it('opening dice: highest first, ties reroll', () => {
    const seq = (vals: number[]) => { let i = 0; return () => vals[i++]; };
    expect(rollOpeningDice(['p1', 'p2'], seq([2, 5])).firstPlayerId).toBe('p2');
    expect(rollOpeningDice(['p1', 'p2'], seq([4, 4, 6, 1])).firstPlayerId).toBe('p1');
    const s = createInitialGameState(configs, 'T', { roll: seq([1, 6]) });
    expect(s.firstPlayerId).toBe('p2');
    expect(s.activePlayerId).toBe('p2');
  });

  it('firstPlayerId option skips the roll', () => {
    const s = make({ firstPlayerId: 'p2' });
    expect(s.activePlayerId).toBe('p2');
    expect(s.firstPlayerId).toBe('p2');
    expect(s.openingRolls).toEqual([]);
  });
});

describe('E11 first-draw skip (R5)', () => {
  it('p1 has 3 after first turn, p2 has 4', () => {
    let s = startTurn(make());
    expect(s.players.p1.hand).toHaveLength(3);
    s = startTurn(endTurn(s));
    expect(s.activePlayerId).toBe('p2');
    expect(s.players.p2.hand).toHaveLength(4);
  });

  it('first player p2 skips; round counter ticks when play returns to p2', () => {
    let s = startTurn(make({ firstPlayerId: 'p2' }));
    expect(s.players.p2.hand).toHaveLength(3);
    s = startTurn(endTurn(s));
    expect(s.players.p1.hand).toHaveLength(4);
    expect(s.turnNumber).toBe(1);
    s = endTurn(s);
    expect(s.activePlayerId).toBe('p2');
    expect(s.turnNumber).toBe(2);
  });

  it('a hand-built state without the flag still draws', () => {
    const s: any = make();
    delete s.firstTurnDrawSkipPending;
    expect(startTurn(s).players.p1.hand).toHaveLength(4);
  });
});
