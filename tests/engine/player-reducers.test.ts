import { describe, expect, it } from "vitest";
import {
  activatePiecie,
  discardCard,
  drawCard,
  gainMP,
  levelUpMosje,
  loseMP,
  playPiecieFaceDown,
  switchActiveMosje
} from "../../src/engine/reducers/player/index.js";
import { deepFreeze } from "../../src/utils/freeze.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function card(id: string): CardId {
  return id as CardId;
}

function baseState(): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: card("mosje_a"), level: 1, mp: 95, flags: {} },
          { instanceId: "m2", cardId: card("mosje_b"), level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 1, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 }
        ],
        hand: [card("piecie_a"), card("snelle_jensen")],
        deck: [card("deck1"), card("deck2")],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: card("mosje_c"), level: 1, mp: 30, flags: {} },
          { instanceId: "m4", cardId: card("mosje_d"), level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 1, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 }
        ],
        hand: [],
        deck: [],
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
    rngSeed: 123
  };
}

describe("player reducers", () => {
  it("drawCard moves top of deck to hand and emits event", () => {
    const frozen = deepFreeze(baseState());
    const next = drawCard(frozen, { playerId: "p1" });

    expect(next.players[0].deck).toEqual([card("deck2")]);
    expect(next.players[0].hand).toEqual([card("piecie_a"), card("snelle_jensen"), card("deck1")]);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_drawn", playerId: "p1", cardId: card("deck1") });
    expect(frozen.players[0].deck).toEqual([card("deck1"), card("deck2")]);
  });

  it("drawing from empty deck is no-op and emits no event", () => {
    const state = deepFreeze({
      ...baseState(),
      players: [{ ...baseState().players[0], deck: [] }, baseState().players[1]]
    });

    const next = drawCard(state, { playerId: "p1" });
    expect(next).toBe(state);
    expect(next.eventLog).toHaveLength(0);
  });

  it("discardCard moves card from hand to discard and is pure", () => {
    const frozen = deepFreeze(baseState());
    const next = discardCard(frozen, { playerId: "p1", cardId: card("piecie_a") });

    expect(next.players[0].hand).toEqual([card("snelle_jensen")]);
    expect(next.players[0].discard).toEqual([card("piecie_a")]);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_discarded", playerId: "p1" });
    expect(frozen.players[0].discard).toEqual([]);
  });

  it("playPiecieFaceDown rejects action when all 5 slots are occupied", () => {
    const occupiedSlots = [0, 1, 2, 3, 4].map((slotIndex) => ({
      slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
      cardId: card(`p${slotIndex}`),
      faceUp: false,
      turnsSincePlaced: 0
    }));

    const state = deepFreeze({
      ...baseState(),
      players: [{ ...baseState().players[0], piecieSlots: occupiedSlots }, baseState().players[1]]
    });

    const next = playPiecieFaceDown(state, {
      playerId: "p1",
      cardId: card("piecie_a"),
      slotIndex: 0
    });

    expect(next).toBe(state);
  });

  it("playPiecieFaceDown moves hand card into slot and emits piecie_placed", () => {
    const state = deepFreeze(baseState());
    const next = playPiecieFaceDown(state, {
      playerId: "p1",
      cardId: card("piecie_a"),
      slotIndex: 0
    });

    expect(next.players[0].piecieSlots[0]).toMatchObject({ cardId: card("piecie_a"), faceUp: false, turnsSincePlaced: 0 });
    expect(next.players[0].hand).toEqual([card("snelle_jensen")]);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "piecie_placed", slotIndex: 0 });
    expect(state.players[0].piecieSlots[0].cardId).toBeNull();
  });

  it("activatePiecie requires one turn unless action marks card as Snelle", () => {
    const state = deepFreeze(
      playPiecieFaceDown(baseState(), {
        playerId: "p1",
        cardId: card("snelle_jensen"),
        slotIndex: 0
      })
    );

    const blocked = activatePiecie(state, { playerId: "p1", slotIndex: 0, isSnelle: false });
    expect(blocked).toBe(state);

    const snelle = activatePiecie(state, { playerId: "p1", slotIndex: 0, isSnelle: true });
    expect(snelle.players[0].piecieSlots[0].faceUp).toBe(true);
    expect(snelle.eventLog.at(-1)).toMatchObject({ type: "piecie_activated", slotIndex: 0 });
  });

  it("switchActiveMosje toggles index 0 and 1", () => {
    const frozen = deepFreeze(baseState());
    const next = switchActiveMosje(frozen, { playerId: "p1" });
    expect(next.players[0].activeMosjeIndex).toBe(1);
    expect(frozen.players[0].activeMosjeIndex).toBe(0);
  });

  it("gainMP crossing 100 triggers level-up cascade event", () => {
    const frozen = deepFreeze(baseState());
    const next = gainMP(frozen, {
      target: { playerId: "p1", instanceId: "m1" },
      amount: 10,
      source: { kind: "card", cardId: card("piecie_a") }
    });

    expect(next.players[0].mosjes[0]).toMatchObject({ level: 2, mp: 0 });
    expect(next.eventLog.find((event) => event.type === "mp_gained")).toBeDefined();
    expect(next.eventLog.find((event) => event.type === "mosje_leveled_up")).toBeDefined();
    expect(frozen.players[0].mosjes[0]).toMatchObject({ level: 1, mp: 95 });
  });

  it("loseMP allows negative and sets cannot_complete_quests flag", () => {
    const frozen = deepFreeze(baseState());
    const next = loseMP(frozen, {
      target: { playerId: "p1", instanceId: "m2" },
      amount: 25,
      source: { kind: "ability" }
    });

    expect(next.players[0].mosjes[1].mp).toBe(-15);
    expect(next.players[0].mosjes[1].flags).toMatchObject({ cannot_complete_quests: true });
    expect(next.eventLog.at(-1)).toMatchObject({ type: "mp_lost" });
  });

  it("levelUpMosje levels and resets mp when threshold met", () => {
    const state = deepFreeze({
      ...baseState(),
      players: [
        {
          ...baseState().players[0],
          mosjes: [{ ...baseState().players[0].mosjes[0], mp: 100 }, baseState().players[0].mosjes[1]]
        },
        baseState().players[1]
      ]
    });

    const next = levelUpMosje(state, { target: { playerId: "p1", instanceId: "m1" } });
    expect(next.players[0].mosjes[0]).toMatchObject({ level: 2, mp: 0 });
    expect(next.eventLog.at(-1)).toMatchObject({ type: "mosje_leveled_up", newLevel: 2 });
  });
});
