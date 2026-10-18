// BOT-02 engine fix (61-06): an own-turn reaction offer must include the Delluft parking fee, exactly as payEnergy will
// charge it ("the first time a player pays Energy on their own turn, they pay 1 more"). Off-turn windows are unchanged.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { getEligibleReactions } from "../../src/engine/reactions/getEligibleReactions.js";
// @ts-expect-error - JS module, no type declarations
import { payEnergy } from "../../src/engine/energy/payEnergy.js";
// @ts-expect-error - JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";

const mosje = (cardId: string) => ({ cardId, name: cardId, mp: 80, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false });
const SLEUTELPUNTJE = { cardId: "snelle_sleutelpuntje", type: "SNELLE_PIECIE" }; // 1 Energy, beforeOwnQuestRoll
const JENSEN = { cardId: "snelle_jensen", type: "SNELLE_PIECIE" }; // 1 Energy, targeted
const OWN_ROLL = ["beforeOwnQuestRoll"];

// Delluft in play, turn 3. `active` is whose turn it is; player_1 is the responder.
function build({ energy, hand, active = "player_1", field = "mosje_gandoe_wizard", feePaid = false }: { energy: number; hand: any[]; active?: string; field?: string; feePaid?: boolean }) {
  return makeEngineState({
    turnNumber: 3,
    activePlayerId: active,
    activePlace: "place_delluft",
    players: {
      player_1: { energy, hand, activeSlots: [mosje(field), null], ...(feePaid ? { delluftFeeTurn: 3 } : {}) },
      player_2: { energy: 5, activeSlots: [mosje("mosje_jeffrey"), null] },
    },
  });
}

describe("getEligibleReactions: Delluft fee in the Energy check", () => {
  it("own turn: a 1-Energy Snelle needs 2 Energy (1 + fee) - Energy 1 is not offered, Energy 2 is", () => {
    expect(getEligibleReactions(build({ energy: 1, hand: [SLEUTELPUNTJE] }), "player_1", OWN_ROLL)).toEqual([]);
    expect(getEligibleReactions(build({ energy: 2, hand: [SLEUTELPUNTJE] }), "player_1", OWN_ROLL)).toEqual(["snelle_sleutelpuntje"]);
  });

  it("own turn, fee already paid this turn: Energy 1 pays the Snelle", () => {
    expect(getEligibleReactions(build({ energy: 1, hand: [SLEUTELPUNTJE], feePaid: true }), "player_1", OWN_ROLL)).toEqual(["snelle_sleutelpuntje"]);
  });

  it("opponent's turn: no fee, Energy 1 pays a 1-Energy defender Snelle", () => {
    const st = build({ energy: 1, hand: [JENSEN], active: "player_2" });
    expect(getEligibleReactions(st, "player_1", ["targeted"])).toEqual(["snelle_jensen"]);
  });

  it("own turn with a Coert on the field: the fee is waived, Energy 1 is enough", () => {
    expect(getEligibleReactions(build({ energy: 1, hand: [SLEUTELPUNTJE], field: "mosje_coert_tech" }), "player_1", OWN_ROLL)).toEqual(["snelle_sleutelpuntje"]);
  });

  it("what is offered is what payEnergy accepts, at every Energy level", () => {
    for (const energy of [0, 1, 2, 3]) {
      const st = build({ energy, hand: [SLEUTELPUNTJE] });
      const offered = getEligibleReactions(st, "player_1", OWN_ROLL).length === 1;
      expect(offered, `Energy ${energy}`).toBe(payEnergy(st, "player_1", 1).success);
    }
  });
});
