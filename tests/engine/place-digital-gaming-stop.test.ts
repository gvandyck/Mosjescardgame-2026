import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { placeGearDraw } from "../../src/abilities/place/placeTurnQuestEffects.js";
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module, no type declarations
import { PIECIES } from "../../src/data/piecies.js";

// Digital Gaming Stop (Obby 2.0): whoever activates a gear Piecie also draws 1 card.
const gear = PIECIES.find((p: any) => p.tag === "gear");
const food = PIECIES.find((p: any) => p.tag === "food");
const build = (place: string | null, deck = 2) => makeEngineState({
  activePlace: place,
  players: { player_1: { deck: Array(deck).fill({ cardId: "piecie_kannetje_melk", type: "PIECIE" }) }, player_2: { deck: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }] } },
});

describe("place_digital_gaming_stop — gear draw", () => {
  it("draws 1 for either player who activates a gear Piecie", () => {
    const s = build("place_digital_gaming_stop");
    expect(placeGearDraw(s, "player_1", gear).players.player_1.hand).toHaveLength(1);
    expect(placeGearDraw(s, "player_2", gear).players.player_2.hand).toHaveLength(1);
  });
  it("draws nothing for a non-gear Piecie, another Place, or an empty deck", () => {
    expect(placeGearDraw(build("place_digital_gaming_stop"), "player_1", food).players.player_1.hand).toHaveLength(0);
    expect(placeGearDraw(build(null), "player_1", gear).players.player_1.hand).toHaveLength(0);
    expect(placeGearDraw(build("place_digital_gaming_stop", 0), "player_1", gear).players.player_1.hand).toHaveLength(0);
  });
});
