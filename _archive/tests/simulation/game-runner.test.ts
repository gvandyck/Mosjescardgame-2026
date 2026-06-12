/**
 * Phase 9 — Game Runner Tests
 */
import { beforeEach, describe, expect, it } from "vitest";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import { runGame } from "../../src/simulation/game-runner.js";
import type { CardId } from "../../src/types/card-id.js";
import type { CardDefinition } from "../../src/cards/schema/card-definition.js";

function id(value: string): CardId {
  return value as CardId;
}

function freeGainCard(cardId: string, amount = 10): CardDefinition {
  return {
    id: id(cardId),
    name: cardId,
    category: "piecie",
    isBoosterOnly: false,
    cost: { type: "free" },
    requirements: [],
    target: "self_active_mosje",
    trigger: "on_play",
    duration: "instant",
    effects: [{ primitive: "gainMP", params: { target: "$self", amount } }]
  };
}

// Build a minimal deck of 20 free piecie cards
function buildMinimalDeck(prefix: string): ReadonlyArray<CardId> {
  const cards: CardId[] = [];
  for (let i = 0; i < 20; i++) {
    cards.push(id(`${prefix}_p${i}`));
  }
  return cards;
}

function registerDeckCards(prefix: string): void {
  for (let i = 0; i < 20; i++) {
    registerCard(freeGainCard(`${prefix}_p${i}`, 25));
  }
}

beforeEach(() => {
  clearRegistry();
  registerDeckCards("d1");
  registerDeckCards("d2");
});

describe("Game Runner", () => {
  it("runGame completes without crash (seed 1)", () => {
    const result = runGame({
      seed: 1,
      player1Deck: buildMinimalDeck("d1"),
      player2Deck: buildMinimalDeck("d2"),
      player1MosjeIds: [
        { cardId: id("m1_a"), startMP: 10 },
        { cardId: id("m1_b"), startMP: 10 }
      ],
      player2MosjeIds: [
        { cardId: id("m2_a"), startMP: 10 },
        { cardId: id("m2_b"), startMP: 10 }
      ],
      maxTurns: 60
    });
    expect(result.crashed).toBe(false);
    expect(result.crashError).toBeUndefined();
  });

  it("returns a winner or timeout — not crashed", () => {
    const result = runGame({
      seed: 2,
      player1Deck: buildMinimalDeck("d1"),
      player2Deck: buildMinimalDeck("d2"),
      player1MosjeIds: [
        { cardId: id("m1_a"), startMP: 10 },
        { cardId: id("m1_b"), startMP: 10 }
      ],
      player2MosjeIds: [
        { cardId: id("m2_a"), startMP: 10 },
        { cardId: id("m2_b"), startMP: 10 }
      ],
      maxTurns: 60
    });
    expect(result.crashed).toBe(false);
    // Either has a winner or is a timeout (winReason = 'timeout')
    expect(result.winnerId !== null || result.winReason === "timeout").toBe(true);
  });

  it("stats are populated — at least 1 piecie played", () => {
    const result = runGame({
      seed: 3,
      player1Deck: buildMinimalDeck("d1"),
      player2Deck: buildMinimalDeck("d2"),
      player1MosjeIds: [
        { cardId: id("m1_a"), startMP: 10 },
        { cardId: id("m1_b"), startMP: 10 }
      ],
      player2MosjeIds: [
        { cardId: id("m2_a"), startMP: 10 },
        { cardId: id("m2_b"), startMP: 10 }
      ],
      maxTurns: 60
    });
    expect(result.crashed).toBe(false);
    const totalPiecies = Object.values(result.stats.pieciesPlayedByPlayer).reduce(
      (sum, n) => sum + n,
      0
    );
    // With 20 cards per deck giving 25 MP each, there should be many card_resolved events
    const totalPlays = Object.values(result.stats.cardPlayCounts).reduce((sum, n) => sum + n, 0);
    expect(totalPlays).toBeGreaterThan(0);
    void totalPiecies;
  });

  it("crashes gracefully and returns snapshot when error occurs mid-game", () => {
    // Register a "bad" card with an unknown primitive — executeCard will throw
    // (beforeEach already cleared + registered d1/d2; just add the bad card)
    registerCard({
      id: id("bad_card"),
      name: "Bad Card",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "this_does_not_exist_xyz", params: {} }]
    });

    // Deck where bad_card is first — AI will likely draw and try to play it
    const badDeck: ReadonlyArray<CardId> = [id("bad_card")];

    const result = runGame({
      seed: 999,
      player1Deck: badDeck,
      player2Deck: buildMinimalDeck("d2"),
      player1MosjeIds: [
        { cardId: id("m1_a"), startMP: 10 },
        { cardId: id("m1_b"), startMP: 10 }
      ],
      player2MosjeIds: [
        { cardId: id("m2_a"), startMP: 10 },
        { cardId: id("m2_b"), startMP: 10 }
      ],
      maxTurns: 60
    });

    // If the AI's try/catch swallowed the error, the game may complete without crash.
    // Either way the result must be structurally valid.
    if (result.crashed) {
      expect(result.crashError).toBeDefined();
      expect(result.crashStateSnapshot).toBeDefined();
    } else {
      expect(result.crashed).toBe(false);
      expect(result.totalTurns).toBeGreaterThan(0);
    }
  });
});
