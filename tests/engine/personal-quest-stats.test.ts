// @ts-nocheck
// Phase 72-14 (D-17, CC-14): Personal Quest attempts are counted apart from general Quests.
import { describe, expect, it } from "vitest";
import { makeEngineState } from "../helpers/makeEngineState.js";
import { mkSlot } from "../helpers/quest56.js";
import { startTurn } from "../../src/engine/turnManager.js";
import { createInitialGameState } from "../../src/engine/gameState.js";
import { rollPersonalQuestAttempt } from "../../src/engine/personalQuests/rollPersonalQuestAttempt.js";
import { resolvePersonalQuestAttempt } from "../../src/engine/personalQuests/resolvePersonalQuestAttempt.js";

const filler = (n: number) => Array.from({ length: n }, (_, i) => ({ cardId: `filler_${i}`, type: "PIECIE" }));

function build() {
  const mine = mkSlot({ level: 3, mp: 60, subtype: "PHYSICAL", traits: { strength: 2 } });
  const foe = mkSlot({ level: 3, mp: 60 });
  return startTurn(makeEngineState({
    turnNumber: 5,
    players: {
      player_1: { activeSlots: [mine, null], deck: filler(8), hand: [{ cardId: "pq_charge", type: "PERSONAL_QUEST" }] },
      player_2: { activeSlots: [foe, null], deck: filler(8) },
    },
  }));
}
const attempt = (rng) => {
  const r = rollPersonalQuestAttempt(build(), "player_1", { cardId: "pq_charge", slotIndex: 0, rng });
  return { r, done: resolvePersonalQuestAttempt(r.state, r.pending) };
};

describe("personalQuestStats", () => {
  it("new players start at 0 / 0", () => {
    const gs = createInitialGameState([{ playerId: "player_1", name: "A", deckId: "STARTER_PHYSICAL" }, { playerId: "player_2", name: "B", deckId: "STARTER_DIGITAL" }], "ROOM");
    expect(gs.players.player_1.personalQuestStats).toEqual({ attempted: 0, won: 0 });
    expect(gs.players.player_2.personalQuestStats).toEqual({ attempted: 0, won: 0 });
  });

  it("a fail adds one attempt, no win, and leaves questStats alone", () => {
    const { done } = attempt(() => 0.2);
    expect(done.state.players.player_1.personalQuestStats).toEqual({ attempted: 1, won: 0 });
    expect(done.state.players.player_1.questStats).toBeUndefined();
  });

  it("a win adds one attempt and one win", () => {
    const { done } = attempt(() => 0.7);
    expect(done.state.players.player_1.personalQuestStats).toEqual({ attempted: 1, won: 1 });
    expect(done.state.players.player_1.questStats).toBeUndefined();
    expect(done.state.players.player_2.personalQuestStats).toBeUndefined();
  });

  it("a refused resolve (reaction window open) counts nothing", () => {
    const { r } = attempt(() => 0.7);
    const open = { ...r.state, pendingReaction: { x: 1 } };
    const out = resolvePersonalQuestAttempt(open, r.pending);
    expect(out.ok).toBe(false);
    expect(open.players.player_1.personalQuestStats).toBeUndefined();
  });
});
