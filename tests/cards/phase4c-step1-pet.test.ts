import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { endTurn } from "../../src/engine/end-turn.js";
import { BOWIE_STORMEY, GEKKE_VOGELS, KATJEGANG, VIANNA_POES } from "../../src/cards/piecies/pet/index.js";
import { checkPetSynergy } from "../../src/effects/conditions/check-pet-synergy.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createState(): GameState {
  return {
    turnCount: 10,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("self_main"), level: 2, mp: 50, flags: {} },
          { instanceId: "m2", cardId: cardId("ally"), level: 1, mp: 30, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
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
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: cardId("opp_main"), level: 1, mp: 40, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((slotIndex) => ({
          slotIndex: slotIndex as 0 | 1 | 2 | 3 | 4,
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
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 7,
    lastRoll: null
  };
}

function playPet(petId: string, state: GameState = createState()) {
  return executeCard(state, cardId(petId), {
    actingPlayerId: "p1",
    actingMosjeRef: { playerId: "p1", instanceId: "m1" }
  });
}

beforeEach(() => {
  clearRegistry();
  registerCard(BOWIE_STORMEY);
  registerCard(GEKKE_VOGELS);
  registerCard(KATJEGANG);
  registerCard(VIANNA_POES);
});

describe("phase4c step 1 - pet piecies", () => {
  it.each([
    ["bowie-stormey", "pet_active:bowie-stormey"],
    ["gekke-vogels", "pet_active:gekke-vogels"],
    ["katjegang", "pet_active:katjegang"],
    ["vianna-poes", "pet_active:vianna-poes"]
  ])("%s: costs 15 MP, applies buff, gains 10 MP on play", (id, expectedBuffId) => {
    const next = playPet(id);
    const mosje = next.players[0].mosjes[0];

    expect(mosje.mp).toBe(45);
    expect(mosje.flags[`buff:${expectedBuffId}`]).toBeDefined();

    const buff = mosje.flags[`buff:${expectedBuffId}`] as { expiryTurn: number };
    expect(buff.expiryTurn).toBe(12);
  });

  it("checkPetSynergy returns true while buff is active", () => {
    const next = playPet("bowie-stormey");
    expect(
      checkPetSynergy(next, { mosje: { playerId: "p1", instanceId: "m1" }, petCardId: "bowie-stormey" })
    ).toBe(true);
  });

  it("checkPetSynergy returns false after buff expires (clear-expired-buffs)", () => {
    const played = playPet("bowie-stormey");

    const tick1 = endTurn({ ...played, currentPlayerId: "p2" });
    const tick2 = endTurn({ ...tick1, currentPlayerId: "p2" });
    const tick3 = endTurn({ ...tick2, currentPlayerId: "p2" });

    const mosjeAfter = tick3.players[0].mosjes[0];
    expect(mosjeAfter.flags["buff:pet_active:bowie-stormey"]).toBeUndefined();
    expect(
      checkPetSynergy(tick3, { mosje: { playerId: "p1", instanceId: "m1" }, petCardId: "bowie-stormey" })
    ).toBe(false);
  });

  it("one pet buff does NOT satisfy another pet's synergy check", () => {
    const withBowie = playPet("bowie-stormey");
    expect(
      checkPetSynergy(withBowie, { mosje: { playerId: "p1", instanceId: "m1" }, petCardId: "katjegang" })
    ).toBe(false);
    expect(
      checkPetSynergy(withBowie, { mosje: { playerId: "p1", instanceId: "m1" }, petCardId: "bowie-stormey" })
    ).toBe(true);
  });

  it("buff is turn 2 active, gone by turn 3 (off-by-one)", () => {
    const played = playPet("gekke-vogels");
    const mosje = played.players[0].mosjes[0];
    const expiryTurn = (mosje.flags["buff:pet_active:gekke-vogels"] as { expiryTurn: number }).expiryTurn;

    expect(expiryTurn).toBe(12);

    const atExpiry = { ...played, turnCount: 12 };
    expect(
      checkPetSynergy(atExpiry, { mosje: { playerId: "p1", instanceId: "m1" }, petCardId: "gekke-vogels" })
    ).toBe(true);

    const afterExpiry = { ...played, turnCount: 13 };
    const cleared = endTurn({ ...afterExpiry, currentPlayerId: "p1" });
    expect(
      checkPetSynergy(cleared, { mosje: { playerId: "p1", instanceId: "m1" }, petCardId: "gekke-vogels" })
    ).toBe(false);
  });
});
