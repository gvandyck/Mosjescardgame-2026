import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { PIECIES } from "../../src/data/piecies.js";
// @ts-expect-error — JS module, no type declarations
import { SNELLE_PIECIES } from "../../src/data/snellePiecies.js";

// Phase 24 — Plan 01: Interrupt data fixes
//   Test 1: piecie_laat_me_chillen Stays until endOfNextTurn (2.0)
//   Test 2: snelle_negate_elimination description uses "Welloe pile"
// (71-16: the three Emergency Healings heal tests went; Oh nee toch niet is tested in starter-snelle.test.ts.)
describe("Phase 24-01 — Interrupt data fixes", () => {
  it("piecie_laat_me_chillen has stays: endOfNextTurn (V4: persistUntilEndOfTurn)", () => {
    const def = PIECIES.find((p: any) => p.id === "piecie_laat_me_chillen");
    expect(def).toBeDefined();
    expect(def.stays).toBe("endOfNextTurn");
    expect(def.persistUntilEndOfTurn).toBeUndefined();
  });

  it("snelle_negate_elimination description uses the 2.0 'Welloe pile' wording, not 'graveyard'", () => {
    const def = SNELLE_PIECIES.find((p: any) => p.id === "snelle_negate_elimination");
    expect(def).toBeDefined();
    expect(def.description).toContain("Welloe pile");
    expect(def.description).not.toContain("graveyard");
  });
});
