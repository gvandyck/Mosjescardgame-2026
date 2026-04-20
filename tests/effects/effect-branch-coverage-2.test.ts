import { describe, expect, it } from "vitest";
import { activateFaceDownPiecie, destroyPiecie } from "../../src/effects/board/index.js";
import { applyBuff, clearExpiredBuffs } from "../../src/effects/buffs/index.js";
import { discardCards, drawCards, searchDeckAndDraw } from "../../src/effects/cards/index.js";
import { checkLevel } from "../../src/effects/conditions/check-level.js";
import { revealTopDeck } from "../../src/effects/cards/reveal-top-deck.js";
import { checkMP } from "../../src/effects/conditions/check-mp.js";
import { checkPetSynergy } from "../../src/effects/conditions/check-pet-synergy.js";
import { checkSynergy } from "../../src/effects/conditions/check-synergy.js";
import { checkTrait } from "../../src/effects/conditions/check-trait.js";
import { runConditionExpr } from "../../src/effects/control/run-condition-expr.js";
import { gainMP, multiplyNextMPGain, setMP } from "../../src/effects/mp/index.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";

function state(): GameState {
  return {
    turnCount: 3,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: "a", level: 2, mp: 40, flags: { traits: { Creative: 3 }, quest_mp_override: 90 } },
          { instanceId: "m2", cardId: "partner", level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: "pet", faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 1, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 }
        ],
        hand: [],
        deck: ["d1"],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        flags: { "pet:pet:expiryTurn": 2 }
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: "c", level: 1, mp: 10, flags: {} },
          { instanceId: "m4", cardId: "d", level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({ slotIndex: i as 0 | 1 | 2 | 3 | 4, cardId: null, faceUp: false, turnsSincePlaced: 0 })),
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
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
  return { source: { kind: "ability" }, actingPlayerId: "p1", rng: createRng(1), turnCount: 3 };
}

describe("extra branch coverage", () => {
  it("covers condition alternate branches", () => {
    const s = state();
    expect(checkTrait(s, { target: { playerId: "missing", instanceId: "m1" }, trait: "Creative", minStars: 1 })).toBe(false);
    expect(checkSynergy(s, { mosje: { playerId: "p1", instanceId: "missing" }, partnerCardId: "partner" })).toBe(false);
    expect(checkSynergy(s, { mosje: { playerId: "missing", instanceId: "m1" }, partnerCardId: "partner" })).toBe(false);
    expect(checkPetSynergy(s, { mosje: { playerId: "p1", instanceId: "m1" }, petCardId: "pet" })).toBe(false);
    expect(checkPetSynergy(s, { mosje: { playerId: "missing", instanceId: "m1" }, petCardId: "pet" })).toBe(false);
    expect(checkPetSynergy(s, { mosje: { playerId: "p1", instanceId: "missing" }, petCardId: "pet" })).toBe(false);
    expect(checkLevel(s, { target: { playerId: "missing", instanceId: "m1" }, minLevel: 1 })).toBe(false);

    expect(checkMP(s, { target: { playerId: "p1", instanceId: "m1" }, operator: "==", value: 40 })).toBe(true);
    expect(checkMP(s, { target: { playerId: "p1", instanceId: "m1" }, operator: "<=", value: 40 })).toBe(true);
    expect(checkMP(s, { target: { playerId: "p1", instanceId: "m1" }, operator: "between", value: 39, rangeEnd: 41 })).toBe(true);
  });

  it("covers condition-expression dispatch paths", () => {
    const s = {
      ...state(),
      activePlace: { cardId: "place_a", flags: { cardType: "place" } },
      players: state().players.map((player) =>
        player.id === "p1"
          ? {
              ...player,
              piecieSlots: player.piecieSlots.map((slot, index) => (index === 0 ? { ...slot, faceUp: true } : slot)),
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId === "m1"
                  ? {
                      ...mosje,
                      flags: {
                        ...mosje.flags,
                        cardType: "mosje",
                        "buff:pet_active:pet": { data: { petId: "pet" }, expiryTurn: 99 }
                      }
                    }
                  : mosje
              ),
              flags: {}
            }
          : player
      )
    };

    expect(runConditionExpr(s, { condition: "checkTrait", params: { target: { playerId: "p1", instanceId: "m1" }, trait: "Creative", minStars: 1 } })).toBe(true);
    expect(runConditionExpr(s, { condition: "checkSynergy", params: { mosje: { playerId: "p1", instanceId: "m1" }, partnerCardId: "partner" } })).toBe(true);
    expect(runConditionExpr(s, { condition: "checkPetSynergy", params: { mosje: { playerId: "p1", instanceId: "m1" }, petCardId: "pet" } })).toBe(true);
    expect(runConditionExpr(s, { condition: "checkLevel", params: { target: { playerId: "p1", instanceId: "m1" }, minLevel: 2 } })).toBe(true);
    expect(runConditionExpr(s, { condition: "checkMP", params: { target: { playerId: "p1", instanceId: "m1" }, operator: ">=", value: 10 } })).toBe(true);
    expect(runConditionExpr(s, { condition: "checkCardTypeInPlay", params: { playerId: "p1", cardType: "mosje" } })).toBe(true);
    expect(runConditionExpr(s, { condition: "checkPlaceActive", params: { placeCardId: "place_a" } })).toBe(true);
    expect(runConditionExpr(s, { condition: "unknown", params: {} })).toBe(false);
  });

  it("covers board/cards and mp no-op branches", () => {
    const s = state();
    expect(revealTopDeck(s, { playerId: "p1", targetDeckOwner: "missing", count: 1 }, ctx())).toEqual(s);
    expect(destroyPiecie(s, { target: { playerId: "p1", slotIndex: 1 } }, ctx())).toEqual(s);
    expect(activateFaceDownPiecie(s, { playerId: "missing", slotIndex: 0 }, ctx())).toEqual(s);
    const drawMissing = drawCards(s, { playerId: "missing", count: 1 }, ctx());
    expect(drawMissing.eventLog.at(-1)).toMatchObject({ code: "draw_empty_deck" });
    expect(discardCards(s, { playerId: "missing", count: 1, mode: "random" }, ctx())).toEqual(s);
    const emptied = { ...s, players: s.players.map((p) => (p.id === "p1" ? { ...p, hand: [] } : p)) };
    const discardEmpty = discardCards(emptied, { playerId: "p1", count: 1, mode: "random" }, ctx());
    expect(discardEmpty.players[0].discard).toEqual([]);
    expect(searchDeckAndDraw(s, { playerId: "missing", filter: { byName: "d1" } }, ctx())).toEqual(s);
    expect(searchDeckAndDraw(s, { playerId: "p1", filter: { byName: "not_there" } }, ctx())).toEqual(s);

    const withMultiTurn = multiplyNextMPGain(
      s,
      { target: { playerId: "p1", instanceId: "m1" }, multiplier: 2, duration: "this_turn" },
      ctx()
    );
    expect(withMultiTurn.players[0].mosjes[0].flags.mp_gain_multiplier).toBeDefined();
    expect(
      multiplyNextMPGain(s, { target: { playerId: "missing", instanceId: "m1" }, multiplier: 2, duration: "next_gain" }, ctx())
    ).toEqual(s);

    const blockedSet = setMP(
      { ...s, activePlace: { cardId: "place_momentum_stabilizer", flags: {} } },
      { target: { playerId: "p1", instanceId: "m1" }, value: 99 },
      ctx()
    );
    expect(blockedSet.players[0].mosjes[0].mp).toBe(40);
    expect(setMP(s, { target: { playerId: "missing", instanceId: "m1" }, value: 5 }, ctx())).toEqual(s);

    const expiredMulti = {
      ...withMultiTurn,
      players: withMultiTurn.players.map((player) =>
        player.id === "p1"
          ? {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId === "m1"
                  ? {
                      ...mosje,
                      flags: {
                        ...mosje.flags,
                        mp_gain_multiplier: { multiplier: 2, duration: "this_turn", expiresOnTurn: 1 }
                      }
                    }
                  : mosje
              )
            }
          : player
      )
    };
    const expiredApplied = gainMP(expiredMulti, { target: { playerId: "p1", instanceId: "m1" }, amount: 5 }, ctx());
    expect(expiredApplied.players[0].mosjes[0].mp).toBe(45);
  });

  it("covers buff missing-target and non-expiring branches", () => {
    const s = state();
    expect(applyBuff(s, { target: { playerId: "missing" }, buffId: "x", data: {}, expiryTurn: 3 }, ctx())).toEqual(s);
    expect(
      applyBuff(s, { target: { playerId: "p1", instanceId: "missing" }, buffId: "x", data: {}, expiryTurn: 3 }, ctx())
    ).toEqual(s);

    const withBadExpiry = {
      ...s,
      players: s.players.map((player) =>
        player.id === "p1"
          ? {
              ...player,
              flags: {
                ...player.flags,
                "buff:bad": { expiryTurn: Number.NaN },
                regular: 1
              }
            }
          : player
      )
    };
    const cleared = clearExpiredBuffs(withBadExpiry, {}, ctx());
    expect(cleared.players[0].flags["buff:bad"]).toBeDefined();
  });
});
