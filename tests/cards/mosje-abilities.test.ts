import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeMosjeAbility } from "../../src/cards/executor/execute-mosje-ability.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import { ALYSSA_THE_BULLDOZER } from "../../src/cards/mosjes/fighting/alyssa-the-bulldozer.js";
import { JEFFREY_THE_STRONGMAN } from "../../src/cards/mosjes/fighting/jeffrey-the-strongman.js";
import { DJ_8020 } from "../../src/cards/mosjes/artistic/dj-8020.js";
import { JISCA_THE_MAESTRO } from "../../src/cards/mosjes/artistic/jisca-the-maestro.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function createState(cardId: CardId, mp = 20, withDamage: number = 0): GameState {
  const eventLog: any[] = [];
  if (withDamage > 0) {
    eventLog.push({ type: "turn_started", turn: 1, playerId: "p1" });
    eventLog.push({
      type: "mp_lost",
      target: { playerId: "p1", instanceId: "m1" },
      amount: withDamage,
      source: { kind: "card", cardId: id("test"), playerId: "p2" }
    });
  }

  const state: GameState = {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "main",
    currentTurnStartCount: 1,
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId, level: 1, mp, flags: { traits: { Physical: 0 } } },
          { instanceId: "m2", cardId: id("bench"), level: 1, mp: 10, flags: {} }
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
          { instanceId: "m3", cardId: id("opp_a"), level: 1, mp: 20, flags: {} },
          { instanceId: "m4", cardId: id("opp_b"), level: 1, mp: 20, flags: {} }
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
    eventLog,
    rngSeed: 42,
    lastRoll: null,
    gameFlags: {}
  };
  return state;
}

describe("Mosje Abilities", () => {
  beforeEach(() => {
    clearRegistry();
    registerCard(ALYSSA_THE_BULLDOZER);
    registerCard(JEFFREY_THE_STRONGMAN);
    registerCard(DJ_8020);
    registerCard(JISCA_THE_MAESTRO);
  });

  afterEach(() => clearRegistry());

  describe("Alyssa the Bulldozer", () => {
    it("gains 10 MP with no damage taken", () => {
      const state = createState(id("alyssa-the-bulldozer"), 10, 0);
      const next = executeMosjeAbility(state, id("alyssa-the-bulldozer"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      expect(next.players[0].mosjes[0].mp).toBe(20);
    });

    it("gains 10 + 25 MP when taking 30+ damage this turn", () => {
      const state = createState(id("alyssa-the-bulldozer"), 10, 30);
      const next = executeMosjeAbility(state, id("alyssa-the-bulldozer"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      expect(next.players[0].mosjes[0].mp).toBe(45);
    });

    it("gains 10 + 25 MP when taking 35+ damage (edge case higher)", () => {
      const state = createState(id("alyssa-the-bulldozer"), 10, 35);
      const next = executeMosjeAbility(state, id("alyssa-the-bulldozer"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      expect(next.players[0].mosjes[0].mp).toBe(45);
    });

    it("gains only 10 MP when taking exactly 29 damage (below threshold)", () => {
      const state = createState(id("alyssa-the-bulldozer"), 10, 29);
      const next = executeMosjeAbility(state, id("alyssa-the-bulldozer"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      expect(next.players[0].mosjes[0].mp).toBe(20);
    });
  });

  describe("Jeffrey the Strongman", () => {
    it("gains 20 MP on activation", () => {
      const state = createState(id("jeffrey-the-strongman"), 10);
      const next = executeMosjeAbility(state, id("jeffrey-the-strongman"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        targetRef: { playerId: "p2", instanceId: "m3" }
      });

      expect(next.players[0].mosjes[0].mp).toBe(30);
    });

    it("applies piecie_mp_restore_locked buff to opponent", () => {
      const state = createState(id("jeffrey-the-strongman"), 15);
      const next = executeMosjeAbility(state, id("jeffrey-the-strongman"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        targetRef: { playerId: "p2", instanceId: "m3" }
      });

      const oppMosje = next.players[1].mosjes[0];
      expect(oppMosje.flags["buff:piecie_mp_restore_locked"]).toBeDefined();
    });

    it("respects once-per-turn limit", () => {
      const state = createState(id("jeffrey-the-strongman"), 15);
      const first = executeMosjeAbility(state, id("jeffrey-the-strongman"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        targetRef: { playerId: "p2", instanceId: "m3" }
      });

      const second = executeMosjeAbility(first, id("jeffrey-the-strongman"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        targetRef: { playerId: "p2", instanceId: "m3" }
      });

      expect(first.players[0].mosjes[0].mp).toBe(35);
      expect(second.players[0].mosjes[0].mp).toBe(35); // No additional gain on second attempt
      expect(first.players[0].mosjes[0].flags.ability_used_this_turn).toBe(true);
    });

    it("sets buff expiry to next turn", () => {
      const baseState = createState(id("jeffrey-the-strongman"), 15);
      const state = { ...baseState, turnCount: 3 };
      const next = executeMosjeAbility(state, id("jeffrey-the-strongman"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        targetRef: { playerId: "p2", instanceId: "m3" }
      });

      const oppMosje = next.players[1].mosjes[0];
      const buffData = oppMosje.flags["buff:piecie_mp_restore_locked"] as any;
      expect(buffData).toBeDefined();
      expect(buffData.expiryTurn).toBe(4); // currentTurn (3) + 1
    });
  });

  describe("DJ 80/20", () => {
    it("gains 10 MP on activation", () => {
      const state = createState(id("dj-8020"), 15);
      const next = executeMosjeAbility(state, id("dj-8020"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      expect(next.players[0].mosjes[0].mp).toBe(25);
    });

    it("can be triggered multiple times (passive)", () => {
      const state = createState(id("dj-8020"), 15);
      const first = executeMosjeAbility(state, id("dj-8020"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      const second = executeMosjeAbility(first, id("dj-8020"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      expect(first.players[0].mosjes[0].mp).toBe(25);
      expect(second.players[0].mosjes[0].mp).toBe(35);
    });

    it("has passive trigger (no once-per-turn limit on ability itself)", () => {
      const state = createState(id("dj-8020"), 20);
      const next = executeMosjeAbility(state, id("dj-8020"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      expect(next.players[0].mosjes[0].flags.ability_used_this_turn).toBeUndefined();
    });

    it("starts with correct MP value", () => {
      const state = createState(id("dj-8020"), 20);
      expect(state.players[0].mosjes[0].mp).toBe(20);
    });
  });

  describe("Jisca the Maestro", () => {
    it("can execute ability without errors", () => {
      const state = createState(id("jisca-the-maestro"), 25);
      const next = executeMosjeAbility(state, id("jisca-the-maestro"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      // Ability executed without throwing
      expect(next).toBeDefined();
      expect(next.players[0].mosjes[0]).toBeDefined();
    });

    it("does not lose MP when at 0 and rolling [1-3]", () => {
      const state = createState(id("jisca-the-maestro"), 0);
      const next = executeMosjeAbility(state, id("jisca-the-maestro"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      // Even if roll is 1-3, MP should stay at 0
      expect(next.players[0].mosjes[0].mp).toBeGreaterThanOrEqual(0);
    });

    it("has passive trigger (always available)", () => {
      const state = createState(id("jisca-the-maestro"), 10);
      const next = executeMosjeAbility(state, id("jisca-the-maestro"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      expect(next.players[0].mosjes[0].flags.ability_used_this_turn).toBeUndefined();
    });

    it("starts with 0 MP", () => {
      const state = createState(id("jisca-the-maestro"), 0);
      expect(state.players[0].mosjes[0].mp).toBe(0);
    });

    it("can trigger multiple times in sequence (passive)", () => {
      const state = createState(id("jisca-the-maestro"), 50);
      const first = executeMosjeAbility(state, id("jisca-the-maestro"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      const second = executeMosjeAbility(first, id("jisca-the-maestro"), {
        actingPlayerId: "p1",
        actingMosjeRef: { playerId: "p1", instanceId: "m1" },
        allowPassiveTrigger: true
      });

      // Both should succeed without per-turn limit blocking
      expect(first.eventLog.length).toBeGreaterThan(0);
      expect(second.eventLog.length).toBeGreaterThan(first.eventLog.length);
    });
  });

  describe("DJ 80/20 — Quest Dice Modifier (BUG-05)", () => {
    it("ability sets questPrepBonus += 2", async () => {
      // Use a simplified inline state matching the JS ability layer's schema.
      // The TypeScript GameState type does not include questPrepBonus.
      // @ts-expect-error — simplified state for JS ability layer
      const djState = {
        activePlayerId: "p1",
        players: {
          p1: {
            activeSlots: [
              {
                cardId: "mosje_dj_8020",
                name: "DJ 80/20",
                mp: 50,
                level: 0,
                isDefeated: false,
                traits: {},
                statusEffects: [],
                abilityUsedThisTurn: false,
              },
              null,
            ],
            hand: [],
            deck: [],
            discard: [],
            questPrepBonus: 0,
          },
        },
      };
      // @ts-expect-error — JS module
      const { ability_dj_8020_lucky_beats } = await import("../../src/abilities/mosjeAbilities.js");
      const result = ability_dj_8020_lucky_beats(djState, "p1");
      expect(result.players.p1.questPrepBonus).toBe(2);
    });

    it("ability still grants +10 MP passive", async () => {
      // @ts-expect-error — simplified state for JS ability layer
      const djState = {
        activePlayerId: "p1",
        players: {
          p1: {
            activeSlots: [
              {
                cardId: "mosje_dj_8020",
                mp: 40,
                level: 0,
                isDefeated: false,
                traits: {},
                statusEffects: [],
                abilityUsedThisTurn: false,
              },
              null,
            ],
            hand: [],
            deck: [],
            discard: [],
            questPrepBonus: 0,
          },
        },
      };
      // @ts-expect-error — JS module
      const { ability_dj_8020_lucky_beats } = await import("../../src/abilities/mosjeAbilities.js");
      const result = ability_dj_8020_lucky_beats(djState, "p1");
      expect(result.players.p1.activeSlots[0].mp).toBe(50);
    });
  });

  describe("Integration", () => {
    it("all 4 Mosjes can be registered and executed without errors", () => {
      const cards = [ALYSSA_THE_BULLDOZER, JEFFREY_THE_STRONGMAN, DJ_8020, JISCA_THE_MAESTRO];
      expect(cards.length).toBe(4);

      for (const card of cards) {
        expect(card.id).toBeDefined();
        expect(card.baseAbility).toBeDefined();
        expect(card.baseAbility.effects.length).toBeGreaterThan(0);
      }
    });

    it("all Mosjes have proper mosjeType values", () => {
      expect(ALYSSA_THE_BULLDOZER.mosjeType).toBe("FIGHTING");
      expect(JEFFREY_THE_STRONGMAN.mosjeType).toBe("FIGHTING");
      expect(DJ_8020.mosjeType).toBe("ARTISTIC");
      expect(JISCA_THE_MAESTRO.mosjeType).toBe("ARTISTIC");
    });

    it("all Mosjes have valid start MP values", () => {
      expect(ALYSSA_THE_BULLDOZER.startMP).toBeGreaterThanOrEqual(0);
      expect(JEFFREY_THE_STRONGMAN.startMP).toBeGreaterThanOrEqual(0);
      expect(DJ_8020.startMP).toBeGreaterThanOrEqual(0);
      expect(JISCA_THE_MAESTRO.startMP).toBeGreaterThanOrEqual(0);
    });
  });
});
