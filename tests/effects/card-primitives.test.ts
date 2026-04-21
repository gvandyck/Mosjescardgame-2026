import { describe, expect, it } from "vitest";
import {
  discardCards,
  drawCards,
  lookAtTop,
  revealTopDeck,
  returnToHand,
  searchDeckAndDraw
} from "../../src/effects/cards/index.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";

function createState(): GameState {
  return {
    turnCount: 2,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: "mosje_1", level: 1, mp: 10, flags: {} },
          { instanceId: "m2", cardId: "mosje_2", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: ["h1", "h2", "h3"],
        deck: ["d1", "d2", "d3", "d4", "d5"],
        discard: ["x1"],
        welloePile: ["w1"],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: "mosje_3", level: 1, mp: 10, flags: {} },
          { instanceId: "m4", cardId: "mosje_4", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: ["e1", "e2", "e3"],
        discard: [],
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
    rngSeed: 9,
    lastRoll: null
  };
}

function ctx(seed = 9): EffectContext {
  return {
    source: { kind: "ability", cardId: "test" },
    actingPlayerId: "p1",
    rng: createRng(seed),
    turnCount: 2
  };
}

describe("card primitives", () => {
  it("draw empty deck is no-op with warning", () => {
    const state = {
      ...createState(),
      players: createState().players.map((player) =>
        player.id === "p1" ? { ...player, deck: [] } : player
      )
    };

    const next = drawCards(state, { playerId: "p1", count: 1 }, ctx());
    expect(next.players[0].hand).toEqual(["h1", "h2", "h3"]);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "warning", code: "draw_empty_deck" });
  });

  it("random discard uses seeded rng deterministically", () => {
    const state = createState();
    const a = discardCards(state, { playerId: "p1", count: 1, mode: "random" }, ctx(123));
    const b = discardCards(state, { playerId: "p1", count: 1, mode: "random" }, ctx(123));
    expect(a.players[0].discard).toEqual(b.players[0].discard);
  });

  it("look and reveal do not mutate deck order", () => {
    const state = createState();
    const revealState = revealTopDeck(
      state,
      { playerId: "p1", targetDeckOwner: "p2", count: 2 },
      ctx()
    );
    const lookState = lookAtTop(state, { playerId: "p1", targetDeckOwner: "p2", count: 2 }, ctx());

    expect(revealState.players[1].deck).toEqual(state.players[1].deck);
    expect(lookState.players[1].deck).toEqual(state.players[1].deck);
    expect(revealState.eventLog.at(-1)).toMatchObject({
      type: "cards_revealed_private",
      cards: ["e1", "e2"]
    });
  });

  it("search-and-draw extracts card and shuffles deck", () => {
    const state = createState();
    const next = searchDeckAndDraw(
      state,
      { playerId: "p1", filter: { byName: "d3" } },
      ctx(55)
    );

    expect(next.players[0].hand).toContain("d3");
    expect(next.players[0].deck).toHaveLength(4);
    expect(next.players[0].deck).not.toEqual(["d1", "d2", "d4", "d5"]);
  });

  it("return-to-hand moves from requested zone", () => {
    const state = createState();
    const discardReturn = returnToHand(
      state,
      { playerId: "p1", zone: "discard", cardId: "x1" },
      ctx()
    );
    const welloeReturn = returnToHand(
      state,
      { playerId: "p1", zone: "welloe", cardId: "w1" },
      ctx()
    );

    expect(discardReturn.players[0].hand).toContain("x1");
    expect(discardReturn.players[0].discard).toEqual([]);
    expect(welloeReturn.players[0].hand).toContain("w1");
    expect(welloeReturn.players[0].welloePile).toEqual([]);
  });

  it("choose discard without chosen cards fails with warning", () => {
    const next = discardCards(createState(), { playerId: "p1", count: 2, mode: "choose" }, ctx());
    expect(next.eventLog.at(-1)).toMatchObject({
      type: "warning",
      code: "discard_choose_missing_selection"
    });
  });
});
