import { describe, expect, it } from "vitest";
import { createGame } from "../../src/engine/create-game.js";
import { drawCard, gainMP, loseMP, switchActiveMosje } from "../../src/engine/reducers/player/index.js";
import { advancePhase, startTurn } from "../../src/engine/turn-manager.js";
import type { CardId } from "../../src/types/card-id.js";

function card(id: string): CardId {
  return id as CardId;
}

describe("phase1 smoke integration", () => {
  it("runs 5-turn scripted sequence with immutable state and no early winner", () => {
    const initial = createGame({
      seed: 55,
      players: [
        {
          id: "p1",
          name: "P1",
          deck: [card("d1"), card("d2"), card("d3")],
          mosjes: [
            { cardId: card("m1"), startMP: 10 },
            { cardId: card("m2"), startMP: 15 }
          ]
        },
        {
          id: "p2",
          name: "P2",
          deck: [card("e1"), card("e2"), card("e3")],
          mosjes: [
            { cardId: card("m3"), startMP: 10 },
            { cardId: card("m4"), startMP: 15 }
          ]
        }
      ]
    });

    const initialSnapshot = JSON.stringify(initial);

    let state = initial;
    for (let i = 0; i < 4; i += 1) {
      state = startTurn(state);
      state = advancePhase(state);
      state = advancePhase(state);
      state = advancePhase(state);
      state = advancePhase(state);
    }

    state = drawCard(state, { playerId: state.currentPlayerId });
    state = loseMP(state, {
      target: { playerId: "p1", instanceId: state.players[0].mosjes[0].instanceId },
      amount: 5,
      source: { kind: "ability" }
    });
    state = gainMP(state, {
      target: { playerId: "p2", instanceId: state.players[1].mosjes[0].instanceId },
      amount: 5,
      source: { kind: "quest" }
    });
    state = switchActiveMosje(state, { playerId: "p1" });

    expect(state.turnCount).toBe(5);
    expect(state.eventLog.length).toBeGreaterThan(0);
    expect(state.eventLog.some((event) => event.type === "turn_started")).toBe(true);
    expect(state.eventLog.some((event) => event.type === "turn_ended")).toBe(true);
    expect(state.eventLog.some((event) => event.type === "game_won")).toBe(false);
    expect(JSON.stringify(initial)).toBe(initialSnapshot);

    const afterLevel2 = gainMP(state, {
      target: { playerId: "p1", instanceId: state.players[0].mosjes[0].instanceId },
      amount: 95,
      source: { kind: "card", cardId: card("boost") }
    });
    expect(afterLevel2.eventLog.some((event) => event.type === "mosje_leveled_up")).toBe(true);

    const afterLevel3 = gainMP(afterLevel2, {
      target: { playerId: "p1", instanceId: state.players[0].mosjes[0].instanceId },
      amount: 100,
      source: { kind: "card", cardId: card("boost2") }
    });

    const levelEvents = afterLevel3.eventLog.filter((event) => event.type === "mosje_leveled_up");
    expect(levelEvents.length).toBeGreaterThanOrEqual(2);
    expect(afterLevel3.eventLog.some((event) => event.type === "game_won")).toBe(true);
  });
});
