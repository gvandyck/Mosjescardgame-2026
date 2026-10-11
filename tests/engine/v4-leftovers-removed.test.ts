// RULE-10 guard: V4 leftovers must stay out of src. (Level 0 -> no-level-zero.test.ts.)
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error — JS module
import { createInitialGameState } from '../../src/engine/gameState.js';
// @ts-expect-error — JS module
import { startTurn } from '../../src/engine/turnManager.js';

const SRC = join(__dirname, '..', '..', 'src');
const BANNED = ['skipNextTurn', 'Turn trickle', 'TURN TRICKLE', 'splice(0, 6)', 'first-turn-lock', '[null, null, null, null]', "includes('COST')", 'getFirstActiveSlotIndex', 'getFirstActiveMosjeTagSlotIndex'];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === 'data' ? [] : walk(p);
    return p.endsWith('.js') ? [p] : [];
  });
}
function stripComment(line: string): string {
  const i = line.indexOf('//');
  return i >= 0 ? line.slice(0, i) : line;
}

describe('RULE-10 V4 leftovers removed', () => {
  it('src contains no banned V4 literal (outside comments)', () => {
    const hits: string[] = [];
    for (const f of walk(SRC)) {
      readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        const code = stripComment(line);
        const t = line.trim();
        // Coert's Caravan shield labels (not the removed fresh-protection COST bypass)
        if (f.endsWith('coertsCaravanShield.js')) return;
        if (t.startsWith('*') || t.startsWith('/*')) return;
        for (const b of BANNED) if (code.includes(b)) hits.push(`${f}:${i + 1} ${b}`);
      });
    }
    expect(hits).toEqual([]);
  });

  it('every player starts with 3 hand cards and 3 Piecie slots', () => {
    const state = createInitialGameState(
      [
        { playerId: 'player_1', name: 'A', deckId: 'DUO_WEST_CLESS' },
        { playerId: 'player_2', name: 'B', deckId: 'DUO_GANDOE_MICHELLE' },
      ],
      'ROOM',
      { firstPlayerId: 'player_1' }
    );
    for (const p of Object.values(state.players) as any[]) {
      expect(p.piecieSlots).toHaveLength(3);
      expect(p.hand).toHaveLength(3);
    }
  });

  it('startTurn does not trickle MP onto Mosjes', () => {
    const state = createInitialGameState(
      [
        { playerId: 'player_1', name: 'A', deckId: 'DUO_WEST_CLESS' },
        { playerId: 'player_2', name: 'B', deckId: 'DUO_GANDOE_MICHELLE' },
      ],
      'ROOM',
      { firstPlayerId: 'player_1' }
    );
    const before = JSON.stringify((Object.values(state.players) as any[]).map((p) => p.activeSlots.map((s: any) => s?.mp)));
    const after = startTurn(state).state ?? startTurn(state);
    const mps = JSON.stringify((Object.values(after.players) as any[]).map((p) => p.activeSlots.map((s: any) => s?.mp)));
    expect(mps).toBe(before);
  });
});
