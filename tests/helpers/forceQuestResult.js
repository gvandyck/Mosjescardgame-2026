// forceQuestResult — drive a REAL 2.0 Quest attempt (rollQuestAttempt + resolveQuestAttempt) with forced dice.
// Faces `questId` up in its stack, rolls all-6s (win) or all-1s (lose), resolves, returns the new state.
// Throws if the attempt is refused or the dice do not give the requested result, so a test never passes silently.
import { getQuestDef } from "../../src/engine/quests/getQuestDef.js";
import { rollQuestAttempt } from "../../src/engine/quests/rollQuestAttempt.js";
import { resolveQuestAttempt } from "../../src/engine/quests/resolveQuestAttempt.js";

export function forceQuestResult(state, playerId, { slotIndex = 0, questId, win, choices = {}, costChoice, dieChoices } = {}) {
  const quest = getQuestDef(questId);
  if (!quest) throw new Error(`forceQuestResult: unknown quest ${questId}`);
  const s = JSON.parse(JSON.stringify(state));
  s.activePlayerId = playerId;
  s.questStacks = s.questStacks || {};
  s.questStacks[quest.stack] = { deck: ["quest_filler"], tokens: 0, discard: [], ...s.questStacks[quest.stack], faceUp: questId };
  const rolled = rollQuestAttempt(s, playerId, { slotIndex, stackId: quest.stack, costChoice, dieChoices, rng: () => (win ? 0.99 : 0) });
  if (!rolled.ok) throw new Error(`forceQuestResult: attempt refused: ${rolled.error}`);
  if (rolled.pending.win !== win) throw new Error(`forceQuestResult: dice gave win=${rolled.pending.win}, wanted ${win}`);
  const done = resolveQuestAttempt(rolled.state, rolled.pending, choices);
  if (!done.ok) throw new Error(`forceQuestResult: resolve refused: ${done.error}`);
  return done.state;
}
