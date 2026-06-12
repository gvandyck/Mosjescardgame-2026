/**
 * Phase 9 — AI Player Tests
 */
import { beforeEach, describe, expect, it } from "vitest";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import { createGame } from "../../src/engine/create-game.js";
import { aiTakeTurn } from "../../src/simulation/ai-player.js";
import { createRng } from "../../src/utils/rng.js";
import type { CardId } from "../../src/types/card-id.js";
import type { CardDefinition } from "../../src/cards/schema/card-definition.js";

function id(value: string): CardId {
  return value as CardId;
}

function freeCard(cardId: string, category: "piecie" | "snelle-piecie" | "quest" = "piecie"): CardDefinition {
  return {
    id: id(cardId),
    name: cardId,
    category,
    isBoosterOnly: false,
    cost: { type: "free" },
    requirements: [],
    target: "self_active_mosje",
    trigger: category === "quest" ? "quest_attempt" : "on_play",
    duration: "instant",
    effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
  };
}

beforeEach(() => {
  clearRegistry();
  for (let i = 0; i < 10; i++) {
    registerCard(freeCard(`piecie_${i}`));
  }
  registerCard(freeCard("test_quest", "quest"));
});

describe("AI player — basic turn", () => {
  it("takes a full turn without crashing", () => {
    const state = createGame({
      seed: 42,
      players: [
        {
          id: "p1",
          name: "P1",
          deck: [id("piecie_0"), id("piecie_1"), id("piecie_2")],
          mosjes: [{ cardId: id("m1"), startMP: 50 }, { cardId: id("m2"), startMP: 50 }]
        },
        {
          id: "p2",
          name: "P2",
          deck: [id("piecie_3"), id("piecie_4")],
          mosjes: [{ cardId: id("m3"), startMP: 50 }, { cardId: id("m4"), startMP: 50 }]
        }
      ]
    });
    const rng = createRng(1);
    expect(() => aiTakeTurn(state, "p1", rng)).not.toThrow();
  });

  it("draws a card in the draw phase", () => {
    const state = createGame({
      seed: 42,
      players: [
        {
          id: "p1",
          name: "P1",
          deck: [id("piecie_0"), id("piecie_1"), id("piecie_2"), id("piecie_3"), id("piecie_4")],
          mosjes: [{ cardId: id("m1"), startMP: 50 }, { cardId: id("m2"), startMP: 50 }]
        },
        {
          id: "p2",
          name: "P2",
          deck: [id("piecie_5"), id("piecie_6")],
          mosjes: [{ cardId: id("m3"), startMP: 50 }, { cardId: id("m4"), startMP: 50 }]
        }
      ]
    });
    const rng = createRng(1);
    const result = aiTakeTurn(state, "p1", rng);
    expect(result.eventLog.some((e) => e.type === "card_drawn")).toBe(true);
  });

  it("plays a playable Piecie if available", () => {
    const state = createGame({
      seed: 42,
      players: [
        {
          id: "p1",
          name: "P1",
          deck: [id("piecie_0"), id("piecie_1"), id("piecie_2"), id("piecie_3"), id("piecie_4")],
          mosjes: [{ cardId: id("m1"), startMP: 50 }, { cardId: id("m2"), startMP: 50 }]
        },
        {
          id: "p2",
          name: "P2",
          deck: [id("piecie_5")],
          mosjes: [{ cardId: id("m3"), startMP: 50 }, { cardId: id("m4"), startMP: 50 }]
        }
      ]
    });
    const rng = createRng(1);
    const result = aiTakeTurn(state, "p1", rng);
    const resolvedSuccesses = result.eventLog.filter(
      (e) => e.type === "card_resolved" && "outcome" in e && e.outcome === "success"
    );
    expect(resolvedSuccesses.length).toBeGreaterThan(0);
  });

  it("skips Piecie phase if nothing playable (empty deck, no hand)", () => {
    const state = createGame({
      seed: 10,
      players: [
        {
          id: "p1",
          name: "P1",
          deck: [],
          mosjes: [{ cardId: id("m1"), startMP: 50 }, { cardId: id("m2"), startMP: 50 }]
        },
        {
          id: "p2",
          name: "P2",
          deck: [],
          mosjes: [{ cardId: id("m3"), startMP: 50 }, { cardId: id("m4"), startMP: 50 }]
        }
      ]
    });
    const rng = createRng(1);
    expect(() => aiTakeTurn(state, "p1", rng)).not.toThrow();
    const result = aiTakeTurn(state, "p1", rng);
    const piecieResolved = result.eventLog.filter(
      (e) => e.type === "card_resolved" && "outcome" in e && e.outcome === "success"
    );
    expect(piecieResolved.length).toBe(0);
  });

  it("attempts a Quest if available in hand (drawn from deck)", () => {
    // Deck contains only quest cards — AI draws one and attempts it
    const state = createGame({
      seed: 55,
      players: [
        {
          id: "p1",
          name: "P1",
          deck: [id("test_quest"), id("test_quest"), id("test_quest")],
          mosjes: [{ cardId: id("m1"), startMP: 50 }, { cardId: id("m2"), startMP: 50 }]
        },
        {
          id: "p2",
          name: "P2",
          deck: [],
          mosjes: [{ cardId: id("m3"), startMP: 50 }, { cardId: id("m4"), startMP: 50 }]
        }
      ]
    });
    const rng = createRng(1);
    const result = aiTakeTurn(state, "p1", rng);
    const questAttempted = result.eventLog.some(
      (e) =>
        e.type === "quest_attempted" ||
        e.type === "quest_completed" ||
        e.type === "quest_failed"
    );
    expect(questAttempted).toBe(true);
  });

  it("switches Mosje when active MP < 20", () => {
    const state = createGame({
      seed: 77,
      players: [
        {
          id: "p1",
          name: "P1",
          deck: [],
          mosjes: [{ cardId: id("m1"), startMP: 5 }, { cardId: id("m2"), startMP: 50 }]
        },
        {
          id: "p2",
          name: "P2",
          deck: [],
          mosjes: [{ cardId: id("m3"), startMP: 50 }, { cardId: id("m4"), startMP: 50 }]
        }
      ]
    });
    const rng = createRng(1);
    const p1Before = state.players.find((p) => p.id === "p1");
    const activeIndexBefore = p1Before?.activeMosjeIndex ?? 0;
    const result = aiTakeTurn(state, "p1", rng);
    const p1After = result.players.find((p) => p.id === "p1");
    expect(p1After?.activeMosjeIndex).not.toBe(activeIndexBefore);
  });
});
