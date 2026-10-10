import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { PIECIES } from "../../src/data/piecies.js";
// @ts-expect-error — JS module, no type declarations
import { SNELLE_PIECIES } from "../../src/data/snellePiecies.js";
// @ts-expect-error — JS module, no type declarations
import { effect_snelle_emergency_healings } from "../../src/abilities/snelleEffects.js";

// ─────────────────────────────────────────────────────────────
// Phase 24 — Plan 01: Interrupt data fixes
//   Test 1: piecie_laat_me_chillen has persistUntilEndOfTurn: true
//   Test 2: snelle_negate_elimination description contains "graveyard", not "Welloe pile"
//   Test 3: effect_snelle_emergency_healings heals +25 even when mp > 0 (no guard)
//   Test 4: effect_snelle_emergency_healings heals +35 when resilient >= 2
//   Test 5: effect_snelle_emergency_healings heals when mp = 0 (gain, not set)
// ─────────────────────────────────────────────────────────────

function makeState(mpStart: number, resilient = 0) {
  return {
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "test_mosje",
            mp: mpStart,
            isDefeated: false,
            traits: resilient > 0 ? { resilient } : {},
            statusEffects: [],
          },
          null,
        ],
        graveyard: [],
      },
    },
  };
}

describe("Phase 24-01 — Interrupt data fixes", () => {
  // ── Test 1: piecie_laat_me_chillen lifecycle ──────────────────────────────
  it("piecie_laat_me_chillen has persistUntilEndOfTurn: true", () => {
    const def = PIECIES.find((p: any) => p.id === "piecie_laat_me_chillen");
    expect(def).toBeDefined();
    expect(def.persistUntilEndOfTurn).toBe(true);
  });

  // ── Test 2: Not Today! description uses Welloe pile ───────────────────────
  it("snelle_negate_elimination description uses the 2.0 'Welloe pile' wording, not 'graveyard'", () => {
    const def = SNELLE_PIECIES.find((p: any) => p.id === "snelle_negate_elimination");
    expect(def).toBeDefined();
    expect(def.description).toContain("Welloe pile");
    expect(def.description).not.toContain("graveyard");
  });

  // ── Test 3: unconditional heal when mp > 0 ────────────────────────────────
  it("effect_snelle_emergency_healings heals +25 MP when Mosje has mp=50 (no mp<=0 guard)", () => {
    const state = makeState(50);
    const result = effect_snelle_emergency_healings(state, "player_1");
    expect(result.players.player_1.activeSlots[0].mp).toBe(75);
  });

  // ── Test 4: resilient >= 2 heals +35 ─────────────────────────────────────
  it("effect_snelle_emergency_healings heals +35 MP when Mosje has resilient >= 2", () => {
    const state = makeState(50, 2);
    const result = effect_snelle_emergency_healings(state, "player_1");
    expect(result.players.player_1.activeSlots[0].mp).toBe(85);
  });

  // ── Test 5: heals at mp=0 (gain not set) ─────────────────────────────────
  it("effect_snelle_emergency_healings heals +25 when mp=0 (gain, not set-to-30)", () => {
    const state = makeState(0);
    const result = effect_snelle_emergency_healings(state, "player_1");
    // Should be 0 + 25 = 25, NOT 30 (which was the old set behavior)
    expect(result.players.player_1.activeSlots[0].mp).toBe(25);
  });
});
