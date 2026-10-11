// buildQuestStacks — 3 typed Quest stacks, top card of each turned face-up (Phase 56 resolves them).
import { shuffleDeck } from '../deckEngine.js';
import { QUEST_STACK_IDS } from './setupRules.js';

export function buildQuestStacks(quests, shuffle = shuffleDeck) {
  const stacks = {};
  for (const stackId of QUEST_STACK_IDS) {
    const ids = shuffle(quests.filter(q => q.stack === stackId).map(q => q.id));
    const faceUp = ids.length ? ids.shift() : null;
    stacks[stackId] = { deck: ids, faceUp, tokens: 0, discard: [] };
  }
  return stacks;
}
