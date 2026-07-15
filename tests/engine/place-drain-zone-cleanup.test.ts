import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { gainMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// ─────────────────────────────────────────────────────────────
// Phase 35-07 (PLACE-05) — Drain Zone dead-code cleanup
// Drain Zone's card text only promises "ATTACK Piecies deal +10 damage"
// (a cross-cutting Piecie-effect change explicitly DESCOPED this phase —
// see 35-CONTEXT.md) and "-10 to the lowest-MP Mosje at end phase"
// (placeEffects.js, untouched by this plan). Its untexted +5-to-ALL-gains
// bonus in gainMP is dead code with zero basis in the card's text —
// removed here, independent of the descope decision.
// ─────────────────────────────────────────────────────────────

function buildDrainZoneState(activePlace: string | null) {
  return createEngineState({
    activePlace,
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_a",
            name: "Mosje A",
            traits: {},
            mp: 20,
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
}

describe("place_drain_zone (PLACE-05) — untexted +5-all-gains bonus removed", () => {
  it("gainMP grants exactly the requested amount while Drain Zone is active, not +5", () => {
    const state = buildDrainZoneState("place_drain_zone");
    const after = gainMP(state, "player_1", 0, 25, "GAIN");
    expect(after.players.player_1.activeSlots[0].mp).toBe(45);
  });

  it("gainMP behaves identically with Drain Zone active vs no Place active", () => {
    const withDrainZone = gainMP(buildDrainZoneState("place_drain_zone"), "player_1", 0, 25, "GAIN");
    const withNoPlace = gainMP(buildDrainZoneState(null), "player_1", 0, 25, "GAIN");
    expect(withDrainZone.players.player_1.activeSlots[0].mp).toBe(withNoPlace.players.player_1.activeSlots[0].mp);
  });
});
