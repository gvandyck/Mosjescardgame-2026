import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { ability_dj_8020_lucky_beats } from "../../src/abilities/mosjeAbilities.js";
import { forceQuestResult } from "../helpers/forceQuestResult.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// Phase 48 (48-05) — gap-fill unit tests for the 4 confirmed Mosje-ability requirement
// rows (IMPL-PF-M1, IMPL-PF-M2, IMPL-AR-M1, IMPL-AR-M2) and the Phase-9 BUG-05 row.
// IMPL-AR-M2 (Jisca Perfect Combo) already has qualifying evidence in
// tests/abilities/ability-text-reconciliation.test.ts — not duplicated here.

// Alyssa Bulldozer comeback math (V4 manual ability: +5 per 10 MP lost) removed in 58-04: the 2.0 Card List
// Unstoppable is an attack trigger (covered in the attack trigger tests), not a manual ability.

describe("Jeffrey The Strongman — Brute Force passive quest bonus (IMPL-PF-M2)", () => {
  // Verified against the PASSIVE mechanic (applyMosjeFieldEffectsOnQuest, fired
  // internally by runQuestOutcomeHooks) — NOT the no-op manual ability_jeffrey_brute_force
  // stub, per D-02/T-48-SC.
  const generalQuest = {
    id: "quest_arm_wrestling",
    type: "QUEST",
    questType: "GENERAL",
    category: "Physical",
    requirementId: "quest_req_arm_wrestling",
    successMP: 40,
    failMP: -15,
  };

  function makeJeffreyState() {
    return {
      status: "ACTIVE",
      activePlayerId: "player_1",
      turnNumber: 2,
      activePlace: null,
      players: {
        player_1: {
          name: "P1",
          hand: [],
          deck: [],
          graveyard: [],
          activeSlots: [
            {
              cardId: "mosje_jeffrey",
              name: "[Jeffrey] The Strongman",
              subtype: "FIGHTING",
              traits: {},
              mp: 30,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
          piecieSlots: [null, null, null, null],
          questsCompleted: 0,
          questsCompletedThisTurn: 0,
        },
        player_2: {
          name: "P2",
          hand: [],
          deck: [],
          graveyard: [],
          activeSlots: [
            {
              cardId: "mosje_opponent",
              name: "Opponent",
              traits: {},
              mp: 30,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
          piecieSlots: [null, null, null, null],
          questsCompleted: 0,
          questsCompletedThisTurn: 0,
        },
      },
    };
  }

  it("quest success -> Jeffrey's own MP includes the base gain + the +10 Brute Force passive bonus", () => {
    const state = makeJeffreyState();

    const result = forceQuestResult(state, "player_1", { questId: "quest_quick_thinking", win: true });

    // 2.0 Quick Thinking win (+25, Card List) + passive +10 on the starting 30 MP.
    // (V4 used Arm Wrestling successMP 40; the passive +10 is what this test pins.)
    expect(result.players.player_1.activeSlots[0].mp).toBe(30 + 25 + 10);
  });

  it("quest failure -> no Brute Force bonus (questMpGained is 0)", () => {
    const state = makeJeffreyState();

    const result = forceQuestResult(state, "player_1", { questId: "quest_quick_thinking", win: false });

    expect(result.players.player_1.activeSlots[0].mp).toBe(30 - 15);
  });
});

describe("DJ 80/20 — Lucky Beats (2.0: reaction, not the V4 +10 MP / +2 dice passive)", () => {
  // BUG-05's V4 passive (+10 MP, +2 questPrepBonus) is gone: Lucky Beats is a once-per-turn die reroll at the Quest
  // after-roll pause. The reroll itself is covered in tests/abilities/mosjes-deck3-rest.test.ts.
  it("has no manual activation: the manual entry refuses and adds no Quest dice modifier", () => {
    const state = createEngineState({ players: { player_1: { questPrepBonus: 0 } } });
    expect(() => ability_dj_8020_lucky_beats(state, "player_1")).toThrow(/Quest roll/);
    expect(state.players.player_1.questPrepBonus).toBe(0);
  });
});
