import { describe, expect, it } from "vitest";
import {
  checkCardTypeInPlay,
  checkLevel,
  checkMP,
  checkPetSynergy,
  checkPlaceActive,
  checkSynergy,
  checkTrait
} from "../../src/effects/conditions/index.js";
import type { GameState } from "../../src/types/game-state.js";

function createState(): GameState {
  return {
    turnCount: 7,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          {
            instanceId: "m1",
            cardId: "mosje_alpha",
            level: 2,
            mp: 45,
            flags: {
              traits: {
                Creative: 3,
                Logical: 2,
                Social: 1,
                Brave: 3,
                Focused: 2,
                Wild: 1
              },
              cardType: "mosje",
              quest_mp_override: 90,
              "buff:pet_active:pet_cat": { data: { petId: "pet_cat" }, expiryTurn: 9 }
            }
          },
          { instanceId: "m2", cardId: "partner_card", level: 1, mp: 15, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: "pet_cat", faceUp: true, turnsSincePlaced: 2 },
          { slotIndex: 1, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 }
        ],
        hand: ["partner_card"],
        deck: ["x"],
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
          { instanceId: "m3", cardId: "other", level: 1, mp: 10, flags: {} },
          { instanceId: "m4", cardId: "other2", level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      }
    ],
    activePlace: { cardId: "place_hub", flags: { cardType: "place" }, subscribedTriggers: [] },
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 21,
    lastRoll: null
  };
}

describe("condition primitives", () => {
  it("check-trait supports all configured traits and stars", () => {
    const state = createState();
    const traits: Array<[string, 1 | 2 | 3]> = [
      ["Creative", 3],
      ["Logical", 2],
      ["Social", 1],
      ["Brave", 3],
      ["Focused", 2],
      ["Wild", 1]
    ];

    for (const [trait, stars] of traits) {
      expect(checkTrait(state, { target: { playerId: "p1", instanceId: "m1" }, trait, minStars: stars })).toBe(
        true
      );
    }

    expect(checkTrait(state, { target: { playerId: "p1", instanceId: "m1" }, trait: "Wild", minStars: 2 })).toBe(false);
  });

  it("check-synergy is true only when partner on field", () => {
    const state = createState();
    expect(checkSynergy(state, { mosje: { playerId: "p1", instanceId: "m1" }, partnerCardId: "partner_card" })).toBe(true);
    expect(checkSynergy(state, { mosje: { playerId: "p1", instanceId: "m1" }, partnerCardId: "missing_partner" })).toBe(false);
  });

  it("check-pet-synergy respects buff flag presence and absence", () => {
    const state = createState();
    expect(checkPetSynergy(state, { mosje: { playerId: "p1", instanceId: "m1" }, petCardId: "pet_cat" })).toBe(true);

    const withoutBuff = {
      ...state,
      players: state.players.map((player) => {
        if (player.id !== "p1") return player;
        return {
          ...player,
          mosjes: player.mosjes.map((mosje) => {
            if (mosje.instanceId !== "m1") return mosje;
            const nextFlags = { ...mosje.flags };
            delete nextFlags["buff:pet_active:pet_cat"];
            return { ...mosje, flags: nextFlags };
          })
        };
      })
    };
    expect(checkPetSynergy(withoutBuff, { mosje: { playerId: "p1", instanceId: "m1" }, petCardId: "pet_cat" })).toBe(false);
  });

  it("check-level and place-active behave correctly", () => {
    const state = createState();
    expect(checkLevel(state, { target: { playerId: "p1", instanceId: "m1" }, minLevel: 2 })).toBe(true);
    expect(checkPlaceActive(state, { placeCardId: "place_hub" })).toBe(true);
    expect(checkPlaceActive(state, { placeCardId: "other_place" })).toBe(false);
  });

  it("check-mp uses override for quest checks only", () => {
    const state = createState();
    expect(
      checkMP(state, {
        target: { playerId: "p1", instanceId: "m1" },
        operator: ">=",
        value: 80,
        forQuestCheck: true
      })
    ).toBe(true);

    expect(
      checkMP(state, {
        target: { playerId: "p1", instanceId: "m1" },
        operator: ">=",
        value: 80,
        forQuestCheck: false
      })
    ).toBe(false);
  });

  it("check-card-type-in-play finds mosje/place types and handles missing", () => {
    const state = createState();
    expect(checkCardTypeInPlay(state, { playerId: "p1", cardType: "mosje" })).toBe(true);
    expect(checkCardTypeInPlay(state, { playerId: "p1", cardType: "place" })).toBe(true);
    expect(checkCardTypeInPlay(state, { playerId: "p1", cardType: "quest" })).toBe(false);
  });
});
