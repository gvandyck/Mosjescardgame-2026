import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CardDefinition } from "../../src/cards/schema/card-definition.js";
import type { CardId } from "../../src/types/card-id.js";
import {
  DuplicateCardError,
  RegistryFrozenError,
  UnknownCardError,
  clearRegistry,
  freezeRegistry,
  getAllCards,
  getCard,
  getCardsByCategory,
  hasCard,
  registerCard
} from "../../src/cards/registry/index.js";

function cardId(s: string): CardId {
  return s as CardId;
}

function makeCard(id: string, extra: Partial<CardDefinition> = {}): CardDefinition {
  return {
    id: cardId(id),
    name: `Card ${id}`,
    category: "piecie",
    isBoosterOnly: false,
    cost: { type: "free" },
    requirements: [],
    target: "self_active_mosje",
    trigger: "on_play",
    duration: "instant",
    effects: [],
    ...extra
  };
}

describe("card registry (step 2)", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  describe("registerCard / getCard", () => {
    it("registers a card and retrieves it by id", () => {
      const card = makeCard("phantom-a");
      registerCard(card);
      expect(getCard(cardId("phantom-a"))).toBe(card);
    });

    it("throws UnknownCardError when retrieving an unregistered card", () => {
      expect(() => getCard(cardId("nonexistent"))).toThrow(UnknownCardError);
      expect(() => getCard(cardId("nonexistent"))).toThrow("Unknown card: nonexistent");
    });

    it("throws DuplicateCardError when registering the same id twice", () => {
      registerCard(makeCard("phantom-dup"));
      expect(() => registerCard(makeCard("phantom-dup"))).toThrow(DuplicateCardError);
      expect(() => registerCard(makeCard("phantom-dup"))).toThrow("phantom-dup");
    });
  });

  describe("hasCard", () => {
    it("returns true for registered card", () => {
      registerCard(makeCard("phantom-has"));
      expect(hasCard(cardId("phantom-has"))).toBe(true);
    });

    it("returns false for unregistered card", () => {
      expect(hasCard(cardId("phantom-missing"))).toBe(false);
    });
  });

  describe("getAllCards", () => {
    it("returns empty array when registry is empty", () => {
      expect(getAllCards()).toHaveLength(0);
    });

    it("returns all registered cards", () => {
      registerCard(makeCard("phantom-1"));
      registerCard(makeCard("phantom-2"));
      registerCard(makeCard("phantom-3"));
      expect(getAllCards()).toHaveLength(3);
    });
  });

  describe("getCardsByCategory", () => {
    it("filters cards by category", () => {
      registerCard(makeCard("piecie-1", { category: "piecie" }));
      registerCard(makeCard("mosje-1", { category: "mosje" }));
      registerCard(makeCard("piecie-2", { category: "piecie" }));
      registerCard(makeCard("place-1", { category: "place" }));

      const piecies = getCardsByCategory("piecie");
      expect(piecies).toHaveLength(2);
      expect(piecies.every((c) => c.category === "piecie")).toBe(true);

      const mosjes = getCardsByCategory("mosje");
      expect(mosjes).toHaveLength(1);
    });

    it("returns empty array when no cards match category", () => {
      registerCard(makeCard("phantom-p", { category: "piecie" }));
      expect(getCardsByCategory("quest")).toHaveLength(0);
    });
  });

  describe("clearRegistry", () => {
    it("resets registry so previously registered cards are gone", () => {
      registerCard(makeCard("phantom-reset"));
      clearRegistry();
      expect(hasCard(cardId("phantom-reset"))).toBe(false);
      expect(getAllCards()).toHaveLength(0);
    });

    it("allows re-registering the same id after clear", () => {
      registerCard(makeCard("phantom-reuse"));
      clearRegistry();
      expect(() => registerCard(makeCard("phantom-reuse"))).not.toThrow();
    });
  });

  describe("freezeRegistry", () => {
    it("allows registration before freeze", () => {
      expect(() => registerCard(makeCard("phantom-before-freeze"))).not.toThrow();
    });

    it("throws RegistryFrozenError when registering after freeze", () => {
      registerCard(makeCard("phantom-freeze-test"));
      freezeRegistry();
      expect(() => registerCard(makeCard("phantom-post-freeze"))).toThrow(RegistryFrozenError);
    });

    it("allows getCard after freeze", () => {
      registerCard(makeCard("phantom-frozen-get"));
      freezeRegistry();
      expect(getCard(cardId("phantom-frozen-get")).id).toBe("phantom-frozen-get");
    });

    it("clearRegistry unfreezes so tests stay isolated", () => {
      freezeRegistry();
      clearRegistry(); // resets frozen = false
      expect(() => registerCard(makeCard("phantom-unfrozen"))).not.toThrow();
    });
  });
});
