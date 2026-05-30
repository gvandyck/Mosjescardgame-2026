// BAL-05: Deck-out engine behavior
// Filled in by Plan 04 (Wave 2)
import { describe, it } from 'vitest';

describe('deck-out behavior (BAL-05)', () => {
  it.todo('phaseDrawCard reshuffles discard into deck when deck is empty');
  it.todo('phaseDrawCard sets player.skipNextTurn = true after reshuffle');
  it.todo('phaseDrawCard draws 1 card from the reshuffled deck');
  it.todo('phaseDrawCard does nothing when both deck and discard are empty');
  it.todo('startTurn skips the entire turn when skipNextTurn is true');
  it.todo('startTurn clears skipNextTurn flag after skipping');
  it.todo('startTurn advances activePlayerId to next player on skip');
});
