import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { useMosjeAbility } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { getQuestDiceCount } from "../../src/engine/quests/getQuestDiceCount.js";
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
// 2.0 (Phase 58-01): the once-per-turn waiver is gone; Synergy Chamber is passive
// (holder texts work without the partner) and is tested in synergy-2-0.test.ts.
// ─────────────────────────────────────────────────────────────

afterEach(() => {
  vi.restoreAllMocks();
});

describe("place_synergy_chamber (PLACE-11) — Task 1: dead bonuses removed", () => {
  it("useMosjeAbility does not touch MP when Synergy Chamber is active (no +5 pre-adjust; 2.0 costs Energy)", () => {
    // 2.0: FPS West's ability costs 1 Energy, never MP. The removed V4 +5 "discount"
    // pre-adjusted MP; this probes that Synergy Chamber leaves MP exactly as it was.
    const state = createEngineState({
      activePlace: "place_synergy_chamber",
      activePlayerId: "player_1",
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: "mosje_fps_west",
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
    state._pendingTargets = { card_type: "PIECIE" };
    const result = useMosjeAbility(state, "player_1", "mosje_fps_west");
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

