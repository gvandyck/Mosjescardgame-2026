// A Personal Quest that lands in the pile keeps its type, so it is still a Personal Quest after a reshuffle
// (attemptable by its owner, safe from the opponent). Found by the Phase 70 verifier.
import { describe, it, expect } from 'vitest';
import { toGraveyardEntry } from '../../src/engine/graveyardUtils.js';
import { PERSONAL_QUESTS } from '../../src/data/personalQuests.js';

describe('Personal Quest in the pile', () => {
  it('every Personal Quest keeps type PERSONAL_QUEST and its name as a pile entry', () => {
    for (const pq of PERSONAL_QUESTS) {
      const entry = toGraveyardEntry(pq.id, 'discarded');
      expect(entry.type, pq.id).toBe('PERSONAL_QUEST');
      expect(entry.name, pq.id).toBe(pq.name);
    }
  });
});
