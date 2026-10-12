
// Shared builders for the 56-04 Quest extras tests.
import { makeEngineState } from "./makeEngineState.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { getQuestDef } from "../../src/engine/quests/getQuestDef.js";
import { resolveQuestAttempt } from "../../src/engine/quests/resolveQuestAttempt.js";

const ONE = { physical: 1, mental: 1, creative: 1, technical: 1, resilient: 1, social: 1 };
export function mkSlot(over = {}, mosje = MOSJES[0]) {
  const level = over.level || 1;
  const s = createMosjeSlot(mosje, { level, mp: over.mp ?? 30 });
  s.entryProtected = false;
  s.traits = { ...ONE };
  return Object.assign(s, over);
}
export const byName = (re) => MOSJES.find(m => re.test(m.name));
export function build(questName, { me = null, opp = [mkSlot({ mp: 40 }), null], p1 = {}, p2 = {} } = {}) {
  const q = getQuestDef("quest_" + questName);
  const stacks = {};
  for (const id of ["FIGHTING", "DIGITAL", "ARTISTIC"]) stacks[id] = { deck: ["quest_filler"], faceUp: "quest_tough_it_out", tokens: 0, discard: [] };
  stacks[q.stack] = { deck: ["quest_filler"], faceUp: q.id, tokens: 0, discard: [] };
  const s = makeEngineState({
    questStacks: stacks,
    players: { player_1: { activeSlots: [me || mkSlot(), null], ...p1 }, player_2: { activeSlots: opp, ...p2 } },
  });
  return { s, q };
}
export function finish(s, q, win, choices = {}, extra = {}) {
  const pending = { playerId: "player_1", slotIndex: 0, stackId: q.stack, questId: q.id, win, dice: [5], discardedCardIds: [], ...extra };
  return resolveQuestAttempt(s, pending, choices).state;
}
