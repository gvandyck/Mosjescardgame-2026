import { beforeEach, describe, expect, it } from "vitest";
import { registerCard, clearRegistry } from "../../src/cards/registry/card-registry.js";
import { countCardsInZone } from "../../src/effects/query/index.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";
import type { CardDefinition } from "../../src/cards/schema/card-definition.js";
import type { CardId } from "../../src/types/card-id.js";

function cardId(s: string): CardId {
  return s as CardId;
}

function registerStubCard(id: string, category: CardDefinition["category"], subcategory?: string): void {
  registerCard({
    id: cardId(id),
    name: id,
    category,
    subcategory,
    isBoosterOnly: false,
    cost: { type: "free" },
    requirements: [],
    target: "none",
    trigger: "on_play",
    duration: "instant",
    effects: []
  });
}

function createState(): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("mosje_a"), level: 1, mp: 10, flags: {} },
          { instanceId: "m2", cardId: cardId("mosje_b"), level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: cardId("slot_card_1"), faceUp: true, turnsSincePlaced: 1 },
          { slotIndex: 1, cardId: cardId("slot_card_2"), faceUp: false, turnsSincePlaced: 1 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 }
        ],
        hand: [cardId("hand_piecie_a"), cardId("hand_piecie_b"), cardId("hand_quest")],
        deck: [cardId("deck_piecie")],
        discard: [cardId("discard_piecie"), cardId("discard_place")],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      }
    ],
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 1,
    lastRoll: null
  };
}

function ctx(): EffectContext {
  return {
    source: { kind: "ability" },
    actingPlayerId: "p1",
    rng: createRng(1),
    turnCount: 1
  };
}

beforeEach(() => {
  clearRegistry();
  registerStubCard("hand_piecie_a", "piecie", "FOOD");
  registerStubCard("hand_piecie_b", "piecie", "FOOD");
  registerStubCard("hand_quest", "quest");
  registerStubCard("deck_piecie", "piecie", "UTILITY");
  registerStubCard("discard_piecie", "piecie", "ATTACK");
  registerStubCard("discard_place", "place");
  registerStubCard("slot_card_1", "piecie", "PET");
  registerStubCard("slot_card_2", "piecie", "PET");
});

describe("countCardsInZone query", () => {
  it("counts zone cards without filter", () => {
    expect(countCardsInZone(createState(), { playerId: "p1", zone: "hand" }, ctx())).toBe(3);
    expect(countCardsInZone(createState(), { playerId: "p1", zone: "deck" }, ctx())).toBe(1);
    expect(countCardsInZone(createState(), { playerId: "p1", zone: "discard" }, ctx())).toBe(2);
  });

  it("counts by category and subcategory filters", () => {
    expect(
      countCardsInZone(
        createState(),
        { playerId: "p1", zone: "hand", filter: { category: "piecie" } },
        ctx()
      )
    ).toBe(2);

    expect(
      countCardsInZone(
        createState(),
        { playerId: "p1", zone: "hand", filter: { category: "piecie", subcategory: "FOOD" } },
        ctx()
      )
    ).toBe(2);
  });

  it("counts only face-up cards in piecie_slots", () => {
    expect(countCardsInZone(createState(), { playerId: "p1", zone: "piecie_slots" }, ctx())).toBe(1);
  });
});
