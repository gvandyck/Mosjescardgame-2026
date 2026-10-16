import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { getEffectiveCost } from "../../src/engine/energy/getEffectiveCost.js";
// @ts-expect-error - JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";

// Dierenasiel (Card List 2.0): pet Piecies cost 0 Energy. Welloe Graveyard: Harde Didde, Klaar Met Jou and
// Elimination Strike cost 1 less. (The -10 Power clause lives in getPower: places-power.test.ts.)

const cost = (place: string | null, id: string, kind = "piecie") => getEffectiveCost(makeEngineState({ activePlace: place }), "player_1", id, kind);

describe("place_dierenasiel - pet Piecies cost 0", () => {
  it("a pet Piecie (Bowie Stormey, cost 1) costs 0; a non-pet keeps its cost", () => {
    expect(cost("place_dierenasiel", "piecie_bowie_stormey")).toBe(0);
    expect(cost("place_dierenasiel", "piecie_te_hard_gaan")).toBe(2);
  });
  it("without the Place a pet costs its printed 1", () => {
    expect(cost(null, "piecie_bowie_stormey")).toBe(1);
  });
});

describe("place_welloe_graveyard - Welloe-pile cards cost 1 less", () => {
  it("Harde Didde 4 -> 3, Klaar Met Jou 4 -> 3, Elimination Strike 4 -> 3", () => {
    expect(cost("place_welloe_graveyard", "piecie_harde_didde")).toBe(3);
    expect(cost("place_welloe_graveyard", "piecie_klaar_met_jou")).toBe(3);
    expect(cost("place_welloe_graveyard", "ability_gandoe_destroyer_elimination_strike", "ability")).toBe(3);
  });
  it("other cards and no Place: unchanged", () => {
    expect(cost("place_welloe_graveyard", "piecie_te_hard_gaan")).toBe(2);
    expect(cost(null, "piecie_harde_didde")).toBe(4);
  });
});
