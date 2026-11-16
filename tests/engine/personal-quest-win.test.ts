// @ts-nocheck
// Phase 70-09 (D-01, D-04): the only win is a Level 3 Mosje completing a Personal Quest. Holding Level 3 wins nothing.
// Losing (no Mosje left outside the pile) is unchanged.
import { describe, expect, it } from "vitest";
import { makeEngineState } from "../helpers/makeEngineState.js";
import { mkSlot } from "../helpers/quest56.js";
import { checkVictory } from "../../src/engine/victoryChecker.js";
import { startTurn, endTurn } from "../../src/engine/turnManager.js";
import { rollPersonalQuestAttempt } from "../../src/engine/personalQuests/rollPersonalQuestAttempt.js";
import { resolvePersonalQuestAttempt } from "../../src/engine/personalQuests/resolvePersonalQuestAttempt.js";

const filler = (n: number) => Array.from({ length: n }, (_, i) => ({ cardId: `filler_${i}`, type: "PIECIE" }));
const HIGH = () => 0.7; // d6 = 5

function build({ hand = [] } = {}) {
  const mine = mkSlot({ level: 3, mp: 60, subtype: "PHYSICAL", traits: { strength: 2 } });
  const foe = mkSlot({ level: 3, mp: 60 });
  return makeEngineState({
    turnNumber: 5,
    players: {
      player_1: { activeSlots: [mine, null], deck: filler(8), hand },
      player_2: { activeSlots: [foe, null], deck: filler(8) },
    },
  });
}

describe("holding Level 3 no longer wins (D-01)", () => {
  it("E7: a Level 3 Mosje at the start of its owner's turn: still PLAYING", () => {
    let s = startTurn(build());
    expect(s.status).toBe("PLAYING");
    expect(s.winReason).toBeNull();
  });

  it("E7: two full rounds with a Level 3 Mosje on each side and no attempt: still PLAYING", () => {
    let s = build();
    for (let i = 0; i < 4; i++) {
      s = startTurn(s);
      expect(s.status).toBe("PLAYING");
      s = endTurn(s);
      expect(s.status).toBe("PLAYING");
    }
  });
});

describe("a Personal Quest completes the game", () => {
  it("a won attempt: FINISHED, PERSONAL_QUEST, the winner is the attempting player", () => {
    let s = startTurn(build({ hand: [{ cardId: "pq_charge", type: "PERSONAL_QUEST" }] }));
    const r = rollPersonalQuestAttempt(s, "player_1", { cardId: "pq_charge", slotIndex: 0, rng: HIGH });
    expect(r.ok).toBe(true);
    const done = resolvePersonalQuestAttempt(r.state, r.pending);
    expect(done.state.status).toBe("FINISHED");
    expect(done.state.winnerId).toBe("player_1");
    expect(done.state.winReason).toBe("PERSONAL_QUEST");
    expect(done.state.winningQuest.cardId).toBe("pq_charge");
  });

  it("a failed attempt: the game goes on", () => {
    let s = startTurn(build({ hand: [{ cardId: "pq_charge", type: "PERSONAL_QUEST" }] }));
    const r = rollPersonalQuestAttempt(s, "player_1", { cardId: "pq_charge", slotIndex: 0, rng: () => 0.2 });
    const done = resolvePersonalQuestAttempt(r.state, r.pending);
    expect(done.state.status).toBe("PLAYING");
  });
});

describe("losing is unchanged (D-01)", () => {
  it("a player with no Mosje on the field, in hand or in the deck loses (KNOCKOUT)", () => {
    const s = makeEngineState({
      players: {
        player_1: { activeSlots: [mkSlot({ level: 1, mp: 40 }), null], deck: filler(3) },
        player_2: { activeSlots: [null, null], hand: [], deck: filler(3) },
      },
    });
    const out = checkVictory(s);
    expect(out.status).toBe("FINISHED");
    expect(out.winnerId).toBe("player_1");
    expect(out.winReason).toBe("KNOCKOUT");
  });
});
