// @ts-nocheck
// Phase 70-03 (rules section 11): 40 cards with at least 1 Personal Quest; plus the three rules that stay as they are (D-25).
import { describe, it, expect, vi } from "vitest";
import { isLegalDeck } from "../../src/engine/setup/isLegalDeck.js";
import { DECK_SIZE, MIN_PERSONAL_QUESTS } from "../../src/engine/setup/deckRules.js";
import { STARTER_DECKS } from "../../src/data/starterDecks.js";
import { createInitialGameState, initializeGame } from "../../src/engine/gameState.js";
import { startTurn, endTurn } from "../../src/engine/turnManager.js";
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
import { EXAMPLE_DECKS } from "../../src/data/exampleDecks.js";
import { MOSJES } from "../../src/data/mosjes.js";
import { makeEngineState } from "../helpers/makeEngineState.js";

const IDS = ["STARTER_PHYSICAL", "STARTER_DIGITAL", "STARTER_CREATIVE"];
const deck = (id) => STARTER_DECKS.find((d) => d.id === id);

describe("isLegalDeck (rules section 11)", () => {
  it("constants: 40 cards, at least 1 Personal Quest", () => {
    expect(DECK_SIZE).toBe(40);
    expect(MIN_PERSONAL_QUESTS).toBe(1);
  });

  for (const id of IDS) {
    it(`${id} is legal`, () => {
      expect(isLegalDeck(deck(id))).toEqual({ ok: true, errors: [] });
    });
  }

  it("39 and 41 cards are refused, the reason names the size", () => {
    const d = deck("STARTER_PHYSICAL");
    const short = { ...d, piecies: d.piecies.slice(1) };
    const long = { ...d, piecies: [...d.piecies, d.piecies[0]] };
    for (const bad of [short, long]) {
      const r = isLegalDeck(bad);
      expect(r.ok).toBe(false);
      expect(r.errors.join(" ")).toMatch(/40 cards/);
    }
  });

  it("40 cards without a Personal Quest is refused, the reason names the Personal Quest", () => {
    const d = deck("STARTER_PHYSICAL");
    const noPq = { ...d, personalQuests: [], piecies: [...d.piecies, ...d.piecies.slice(0, d.personalQuests.length)] };
    const r = isLegalDeck(noPq);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/Personal Quest/);
    expect(r.errors.join(" ")).not.toMatch(/40 cards/);
  });

  it("counts { id, qty } entries like buildDeck does", () => {
    const d = { mosjes: [{ id: "a", qty: 5 }], piecies: [{ id: "b", qty: 30 }], snellePiecies: [], places: ["c", "d", "e"], personalQuests: [{ id: "f", qty: 2 }] };
    expect(isLegalDeck(d).ok).toBe(true);
  });

  it("an empty or missing deck is refused without throwing", () => {
    expect(isLegalDeck(undefined).ok).toBe(false);
    expect(isLegalDeck({}).errors).toHaveLength(2);
  });
});

describe("a game built from each starter deck", () => {
  for (const id of IDS) {
    it(`${id}: 1 free Mosje, 3 cards in hand, 2 Energy, a Personal Quest in deck or hand`, () => {
      const log = vi.spyOn(console, "log").mockImplementation(() => {});
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const players = [{ playerId: "player_1", name: "A", deckId: id }, { playerId: "player_2", name: "B", deckId: id }];
        const state = initializeGame(createInitialGameState(players, "R", { firstPlayerId: "player_1" }));
        for (const p of Object.values(state.players)) {
          expect(p.activeSlots.filter(Boolean)).toHaveLength(1);
          expect(p.hand).toHaveLength(3);
          expect(p.energy).toBe(2);
          expect([...p.hand, ...p.deck].filter((c) => c.type === "PERSONAL_QUEST").length).toBeGreaterThanOrEqual(1);
        }
      } finally {
        log.mockRestore();
        warn.mockRestore();
      }
    });
  }
});

describe("rules that stay as they are (D-25)", () => {
  const byCost = MOSJES.filter((x) => Number.isFinite(x.cost)).sort((a, b) => a.cost - b.cost);
  const cheap = byCost[0];
  const dear = byCost[byCost.length - 1];
  const filler = { cardId: "piecie_filler", type: "PIECIE" };

  it("an empty field at turn start: the cheapest Mosje from hand, free and fresh", () => {
    const st = makeEngineState();
    st.players.player_2.activeSlots = [createMosjeSlot(cheap), null];
    st.players.player_1.hand = [{ cardId: dear.id, type: "MOSJE" }, { cardId: cheap.id, type: "MOSJE" }];
    st.players.player_1.deck = [filler, filler];
    const out = startTurn(st).players.player_1;
    const placed = out.activeSlots.filter(Boolean);
    expect(placed).toHaveLength(1);
    expect(placed[0].cardId).toBe(cheap.id);
    expect(placed[0].entryProtected).toBe(true);
    expect(out.hand.some((c) => c.cardId === dear.id)).toBe(true);
  });

  it("the first player skips the very first draw, the second player draws", () => {
    // An Example Deck has a fixed starting Mosje (the 2.1 starters deal a random one, and some Mosjes change the draw step).
    const configs = [{ playerId: "p1", name: "A", deckId: EXAMPLE_DECKS[0].id }, { playerId: "p2", name: "B", deckId: EXAMPLE_DECKS[0].id }];
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      let s = startTurn(createInitialGameState(configs, "R", { firstPlayerId: "p1" }));
      expect(s.players.p1.hand).toHaveLength(3);
      s = startTurn(endTurn(s));
      expect(s.activePlayerId).toBe("p2");
      expect(s.players.p2.hand).toHaveLength(4);
    } finally {
      log.mockRestore();
      warn.mockRestore();
    }
  });

  it("the deck-out turn is a cooldown turn (set at the draw, cleared at endTurn)", () => {
    const st = makeEngineState();
    for (const id of ["player_1", "player_2"]) st.players[id].activeSlots = [createMosjeSlot(cheap), null];
    st.players.player_1.deck = [];
    st.players.player_1.graveyard = [filler, filler];
    const started = startTurn(st);
    expect(started.players.player_1.cooldownTurn).toBe(true);
    const ended = endTurn(started);
    expect(ended.players.player_1.cooldownTurn).toBe(false);
  });
});
