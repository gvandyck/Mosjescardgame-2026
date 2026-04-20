import { describe, expect, it } from "vitest";
import { createGame, InvalidGameConfigError } from "../../src/engine/create-game.js";
import type { CardId } from "../../src/types/card-id.js";

function card(id: string): CardId {
  return id as CardId;
}

function config(seed: number) {
  return {
    seed,
    players: [
      {
        id: "p1",
        name: "P1",
        deck: [card("a"), card("b"), card("c"), card("d")],
        mosjes: [
          { cardId: card("mosje_1"), startMP: 10 },
          { cardId: card("mosje_2"), startMP: 20 }
        ]
      },
      {
        id: "p2",
        name: "P2",
        deck: [card("e"), card("f"), card("g"), card("h")],
        mosjes: [
          { cardId: card("mosje_3"), startMP: 15 },
          { cardId: card("mosje_4"), startMP: 25 }
        ]
      }
    ]
  };
}

describe("createGame", () => {
  it("creates a two-player game state", () => {
    const state = createGame(config(123));
    expect(state.players).toHaveLength(2);
    expect(state.players[0].mosjes).toHaveLength(2);
    expect(state.players[0].hand).toHaveLength(0);
    expect(state.currentPlayerId).toBe("p1");
    expect(state.currentPhase).toBe("draw");
  });

  it("same seed produces identical initial state", () => {
    const one = createGame(config(12345));
    const two = createGame(config(12345));
    expect(one).toStrictEqual(two);
  });

  it("different seed produces different deck shuffle", () => {
    const one = createGame(config(1));
    const two = createGame(config(2));
    expect(one.players[0].deck).not.toStrictEqual(two.players[0].deck);
  });

  it("throws typed errors on invalid config", () => {
    expect(() => createGame({ seed: 1, players: [] })).toThrow(InvalidGameConfigError);

    const tooManyPlayers = {
      seed: 1,
      players: new Array(6).fill(null).map((_, i) => ({
        id: `p${i}`,
        name: `P${i}`,
        deck: [card("d")],
        mosjes: [
          { cardId: card("m1"), startMP: 0 },
          { cardId: card("m2"), startMP: 0 }
        ]
      }))
    };
    expect(() => createGame(tooManyPlayers)).toThrow(InvalidGameConfigError);

    const zeroMosjeConfig = {
      seed: 1,
      players: [
        { id: "p1", name: "P1", deck: [card("x")], mosjes: [] },
        {
          id: "p2",
          name: "P2",
          deck: [card("y")],
          mosjes: [
            { cardId: card("m3"), startMP: 0 },
            { cardId: card("m4"), startMP: 0 }
          ]
        }
      ]
    };
    expect(() => createGame(zeroMosjeConfig)).toThrow(InvalidGameConfigError);
  });
});
