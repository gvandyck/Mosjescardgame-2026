import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { useMosjeAbility, startTurn, activateSynergyWaiver } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { quest_req_perfect_timing, getPartnerSynergyQuestBonus } from "../../src/abilities/questLogic.js";
// @ts-expect-error — JS module, no type declarations
import { getActiveSynergies, hasFoodDoubleSynergy } from "../../src/engine/synergyResolver.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";
// @ts-expect-error — JS module, no type declarations
import fs from "fs";
// @ts-expect-error — JS module, no type declarations
import path from "path";

// ─────────────────────────────────────────────────────────────
// Phase 35-06 (PLACE-11) — Synergy Chamber reconciliation
// Task 1: remove 3 undocumented bonuses (cost -5, dice +1, duration +1)
// that the card's text never promised.
// Task 2: implement the card's ACTUAL headline mechanic — once per turn,
// waive the partner-Mosje-on-field requirement for one synergy-gated
// bonus (Binti+Coert FOOD double, or Señor West+AZN Cless Physical
// quest bonus).
// ─────────────────────────────────────────────────────────────

afterEach(() => {
  vi.restoreAllMocks();
});

describe("place_synergy_chamber (PLACE-11) — Task 1: dead bonuses removed", () => {
  it("useMosjeAbility no longer pre-adjusts MP by +5 when Synergy Chamber is active", () => {
    // mosje_coert_tech's ability costs a flat 10 MP and throws below that
    // threshold. With 5 MP and the OLD +5 pre-payment discount, the ability
    // would have observed 10 MP and succeeded; post-fix it must see the real
    // 5 MP and fail — a genuine behavioral probe for the discount's removal.
    const state = createEngineState({
      activePlace: "place_synergy_chamber",
      activePlayerId: "player_1",
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: "mosje_coert_tech",
              name: "Coert Tech",
              traits: {},
              mp: 5,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
        player_2: { activeSlots: [] },
      },
    });
    const result = useMosjeAbility(state, "player_1", "mosje_coert_tech");
    expect(result.success).toBe(false);
  });

  it("quest_req_perfect_timing's roll is no longer offset by a Synergy-Chamber bonus", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // rollDie(6) => 4
    const result = quest_req_perfect_timing({ activePlace: "place_synergy_chamber" }, null);
    expect(result.diceRoll).toBe(4);
  });

  it("getSynergyChambercostReduction and getSynergyChamberDiceBonus no longer exist as exports", () => {
    const placeEffectsSource = fs.readFileSync(path.resolve("src/abilities/placeEffects.js"), "utf-8");
    expect(placeEffectsSource).not.toContain("export function getSynergyChambercostReduction");
    expect(placeEffectsSource).not.toContain("export function getSynergyChamberDiceBonus");
  });
});

describe("place_synergy_chamber (PLACE-11) — Task 2: once-per-turn partner waiver", () => {
  it("Binti alone (no Coert) gets the FOOD double-MP synergy when the waiver is active", () => {
    const state = createEngineState({
      activePlace: "place_synergy_chamber",
      players: {
        player_1: {
          synergyWaiverActive: true,
          activeSlots: [
            {
              cardId: "mosje_binti",
              name: "Binti",
              traits: {},
              mp: 30,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
        player_2: { activeSlots: [] },
      },
    });
    expect(hasFoodDoubleSynergy(state, "player_1")).toBe(true);
  });

  it("Señor West alone (no AZN Cless) gets the +15 Physical-quest bonus when the waiver is active", () => {
    const state = createEngineState({
      activePlace: "place_synergy_chamber",
      players: {
        player_1: {
          synergyWaiverActive: true,
          activeSlots: [
            {
              cardId: "mosje_martin_senor_west",
              name: "Señor West",
              traits: {},
              mp: 30,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
        player_2: { activeSlots: [] },
      },
    });
    expect(getPartnerSynergyQuestBonus(state, "player_1", "Physical")).toBe(15);
  });

  it("without the waiver flag, partner absence still blocks both bonuses (no regression)", () => {
    const state = createEngineState({
      activePlace: "place_synergy_chamber",
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: "mosje_binti",
              name: "Binti",
              traits: {},
              mp: 30,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
        player_2: { activeSlots: [] },
      },
    });
    expect(hasFoodDoubleSynergy(state, "player_1")).toBe(false);
    expect(getActiveSynergies(state, "player_1")).toEqual([]);
  });

  it("synergyWaiverActive resets to false at the start of the player's next turn", () => {
    const state = createEngineState({
      activePlayerId: "player_1",
      turnNumber: 3,
      players: {
        player_1: { synergyWaiverActive: true, activeSlots: [] },
        player_2: { activeSlots: [] },
      },
    });
    const after = startTurn(state);
    expect(after.players.player_1.synergyWaiverActive).toBe(false);
  });

  it("activateSynergyWaiver sets the flag once and rejects a second activation the same turn", () => {
    const state = createEngineState({
      activePlace: "place_synergy_chamber",
      players: {
        player_1: { activeSlots: [] },
        player_2: { activeSlots: [] },
      },
    });
    const first = activateSynergyWaiver(state, "player_1");
    expect(first.success).toBe(true);
    expect(first.state.players.player_1.synergyWaiverActive).toBe(true);

    const second = activateSynergyWaiver(first.state, "player_1");
    expect(second.success).toBe(false);
  });
});
