import { describe, expect, it } from "vitest";
import { gainMP, loseMP, drainMP, setMP, multiplyNextMPGain } from "../../src/effects/mp/index.js";
import { createRng } from "../../src/utils/rng.js";
import { ModifierSource } from "../../src/types/modifier-source.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";

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
          { instanceId: "m1", cardId: "mosje_1", level: 1, mp: 10, flags: {} },
          { instanceId: "m2", cardId: "mosje_2", level: 1, mp: 0, flags: {} }
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
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: "mosje_3", level: 1, mp: 80, flags: {} },
          { instanceId: "m4", cardId: "mosje_4", level: 1, mp: 20, flags: {} }
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
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 7,
    lastRoll: null
  };
}

function context(): EffectContext {
  return {
    source: { kind: "ability", cardId: "test_card" },
    actingPlayerId: "p1",
    rng: createRng(7),
    turnCount: 1
  };
}

describe("mp primitives", () => {
  it("applies U6 stacking order in gainMP", () => {
    const state = createState();
    const prepared: GameState = {
      ...state,
      players: state.players.map((player) => {
        if (player.id !== "p1") return player;
        return {
          ...player,
          flags: {
            ...player.flags,
            u6_gain_multipliers: {
              [ModifierSource.PARTNER_SYNERGY]: 2
            }
          },
          mosjes: player.mosjes.map((mosje) => {
            if (mosje.instanceId !== "m1") return mosje;
            return {
              ...mosje,
              flags: {
                ...mosje.flags,
                u6_gain_flat_modifiers: {
                  [ModifierSource.MOSJE_PASSIVE]: 10
                },
                mp_gain_multiplier: { multiplier: 1.5, duration: "next_gain" }
              }
            };
          })
        };
      })
    };

    const next = gainMP(prepared, { target: { playerId: "p1", instanceId: "m1" }, amount: 50 }, context());
    const mp = next.players[0].mosjes[0].mp;
    expect(mp).toBe(0);
    expect(next.players[0].mosjes[0].level).toBe(2);
    expect(next.eventLog.find((event) => event.type === "mp_gained")).toMatchObject({
      type: "mp_gained",
      amount: 180
    });
  });

  it("void blocks non-cost loss and gain", () => {
    const state = {
      ...createState(),
      gameFlags: { void_active: true }
    } as GameState;

    const gainState = gainMP(state, { target: { playerId: "p1", instanceId: "m1" }, amount: 20 }, context());
    const loseState = loseMP(state, { target: { playerId: "p1", instanceId: "m1" }, amount: 20 }, context());
    const costState = loseMP(
      state,
      { target: { playerId: "p1", instanceId: "m1" }, amount: 20, isCostPayment: true },
      context()
    );

    expect(gainState.players[0].mosjes[0].mp).toBe(10);
    expect(loseState.players[0].mosjes[0].mp).toBe(10);
    expect(costState.players[0].mosjes[0].mp).toBe(-10);
  });

  it("tracks cumulative non-cost damage only", () => {
    const state = createState();

    const damaged = loseMP(state, { target: { playerId: "p1", instanceId: "m1" }, amount: 12 }, context());
    const costPaid = loseMP(
      damaged,
      { target: { playerId: "p1", instanceId: "m1" }, amount: 7, isCostPayment: true },
      context()
    );

    expect(damaged.players[0].totalDamageTaken).toBe(12);
    expect(costPaid.players[0].totalDamageTaken).toBe(12);
  });

  it("loseMP applies kastelein reduction path", () => {
    const state = createState();
    const prepared: GameState = {
      ...state,
      players: state.players.map((player) => {
        if (player.id !== "p2") return player;
        return {
          ...player,
          mosjes: player.mosjes.map((mosje) => {
            if (mosje.instanceId !== "m3") return mosje;
            return {
              ...mosje,
              flags: {
                ...mosje.flags,
                kast_elein_flat_reduction: 20,
                kast_elein_half_after_threshold: true
              }
            };
          })
        };
      })
    };

    const next = loseMP(prepared, { target: { playerId: "p2", instanceId: "m3" }, amount: 70 }, context());
    expect(next.players[1].mosjes[0].mp).toBe(55);
  });

  it("setMP is blocked by momentum stabilizer", () => {
    const state = {
      ...createState(),
      activePlace: { cardId: "place_momentum_stabilizer", flags: {}, subscribedTriggers: [] }
    } as GameState;

    const next = setMP(state, { target: { playerId: "p1", instanceId: "m1" }, value: 99 }, context());
    expect(next.players[0].mosjes[0].mp).toBe(10);
    expect(next.eventLog.length).toBe(0);
  });

  it("cost payment below 0 sets cannot_complete_quests flag", () => {
    const state = createState();
    const down = loseMP(state, { target: { playerId: "p1", instanceId: "m1" }, amount: 15, isCostPayment: true }, context());
    expect(down.players[0].mosjes[0].flags.cannot_complete_quests).toBe(true);

    const up = gainMP(down, { target: { playerId: "p1", instanceId: "m1" }, amount: 5 }, context());
    expect(up.players[0].mosjes[0].flags.cannot_complete_quests).toBeUndefined();
  });

  it("non-cost damage to exactly 0 MP does NOT defeat (survives at 0)", () => {
    // Rule (phase0-rulings.md:118): a Mosje at exactly 0 survives — it dies only
    // when further damage would push it below 0.
    const state = createState();
    const atZero = loseMP(state, { target: { playerId: "p1", instanceId: "m1" }, amount: 10 }, context());
    expect(atZero.players[0].mosjes[0].mp).toBe(0);
    expect(atZero.players[0].mosjes[0].flags.in_welloe).toBeUndefined();
    expect(atZero.players[0].discard).not.toContain("mosje_1");
  });

  it("non-cost damage BELOW 0 MP defeats the Mosje and adds cardId to discard", () => {
    const state = createState();
    const defeated = loseMP(state, { target: { playerId: "p1", instanceId: "m1" }, amount: 15 }, context());
    expect(defeated.players[0].mosjes[0].flags.in_welloe).toBe(true);
    expect(defeated.players[0].discard).toContain("mosje_1");
    expect(defeated.eventLog.at(-1)).toMatchObject({ type: "mosje_defeated" });
  });

  it("drain transfers actual lost amount only", () => {
    const state = {
      ...createState(),
      players: createState().players.map((player) => {
        if (player.id !== "p1") return player;
        return {
          ...player,
          mosjes: player.mosjes.map((mosje) => {
            if (mosje.instanceId !== "m1") return mosje;
            return { ...mosje, flags: { negate_next_mp_loss: true } };
          })
        };
      })
    };

    const next = drainMP(
      state,
      { from: { playerId: "p1", instanceId: "m1" }, to: { playerId: "p2", instanceId: "m3" }, amount: 20 },
      context()
    );

    expect(next.players[0].mosjes[0].mp).toBe(10);
    expect(next.players[1].mosjes[0].mp).toBe(80);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "mp_drained", amount: 0 });
  });

  it("multiply-next gain is consumed after first gain", () => {
    const state = createState();
    const withBuff = multiplyNextMPGain(
      state,
      { target: { playerId: "p1", instanceId: "m1" }, multiplier: 2, duration: "next_gain" },
      context()
    );
    const first = gainMP(withBuff, { target: { playerId: "p1", instanceId: "m1" }, amount: 10 }, context());
    const second = gainMP(first, { target: { playerId: "p1", instanceId: "m1" }, amount: 10 }, context());

    expect(first.players[0].mosjes[0].mp).toBe(30);
    expect(second.players[0].mosjes[0].mp).toBe(40);
  });

  it("invalid gain emits warning", () => {
    const next = gainMP(createState(), { target: { playerId: "p1", instanceId: "m1" }, amount: 0 }, context());
    expect(next.eventLog.at(-1)).toMatchObject({ type: "warning", code: "gain_mp_invalid_amount" });
  });
});
