import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { useMosjeAbility, startTurn, activateSynergyWaiver } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
// @ts-expect-error - JS module
import { getQuestDiceCount } from "../../src/engine/quests/getQuestDiceCount.js";
import { getPartnerSynergyQuestBonus } from "../../src/abilities/questLogic.js";
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
  it("useMosjeAbility does not touch MP when Synergy Chamber is active (no +5 pre-adjust; 2.0 costs Energy)", () => {
    // 2.0: Coert's ability costs 1 Energy, never MP. The removed V4 +5 "discount"
    // pre-adjusted MP; this probes that Synergy Chamber leaves MP exactly as it was.
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
    expect(result.success).toBe(true);
    expect(result.state.players.player_1.activeSlots[0].mp).toBe(5);
  });

  it("Synergy Chamber adds no Quest die (2.0 getQuestDiceCount; replaces V4 perfect_timing roll offset check)", () => {
    const slot = { name: "T", traits: { technical: 2 }, entryProtected: false };
    const q = { rollTrait: "technical", band: "steady" };
    const base = getQuestDiceCount({ activePlace: null, players: { p1: {} } }, "p1", slot, q);
    const chamber = getQuestDiceCount({ activePlace: "place_synergy_chamber", players: { p1: {} } }, "p1", slot, q);
    expect(chamber).toBe(base);
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
