// Coert, KasteLuck - Morning Luck (Card List 2.0): "at the start of your turn roll a die: 4-6 draw 1 card and this Mosje gains 5 MP."
import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error - JS module
import { startTurn, playPiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { ability_coert_kasteluck_morning_luck } from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error - JS module
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error - JS module
import { mkSlot, byName } from "../helpers/quest56.js";

const KASTELUCK = byName(/KasteLuck/);
const OTHER = byName(/Gandoe, The Wizard/);
const card = (cardId: string) => ({ cardId, type: "PIECIE" });

// Math.random is mocked: the die is the only random thing at the start of turn 5.
function turnStart(roll: number, present = true, deck = [card("piecie_affoe"), card("piecie_kannetje_melk"), card("piecie_affoe")]) {
  vi.spyOn(Math, "random").mockReturnValue((roll - 0.5) / 6);
  const s = makeEngineState({
    turnNumber: 5,
    players: { player_1: { deck, activeSlots: [mkSlot({ mp: 20 }, present ? KASTELUCK : OTHER), null] }, player_2: { activeSlots: [mkSlot({ mp: 20 }), null] } },
  });
  return startTurn(s);
}

afterEach(() => vi.restoreAllMocks());

describe("Coert KasteLuck: Morning Luck", () => {
  it.each([4, 5, 6])("a %i: draws 1 extra card (on top of the turn draw) and gains 5 MP", (roll) => {
    const p = turnStart(roll).players.player_1;
    expect(p.hand).toHaveLength(2); // the normal turn draw + Morning Luck
    expect(p.deck).toHaveLength(1);
    expect(p.activeSlots[0].mp).toBe(25);
  });

  it.each([1, 2, 3])("a %i: nothing", (roll) => {
    const p = turnStart(roll).players.player_1;
    expect(p.hand).toHaveLength(1); // only the turn draw
    expect(p.activeSlots[0].mp).toBe(20);
  });

  it("an empty deck draws nothing but the 5 MP still comes", () => {
    const p = turnStart(6, true, []).players.player_1;
    expect(p.hand).toHaveLength(0);
    expect(p.activeSlots[0].mp).toBe(25);
  });

  it("without KasteLuck on the field there is no roll", () => {
    expect(turnStart(6, false).players.player_1.hand).toHaveLength(1);
  });

  it("no same-turn Piecie activation grant any more (V4 flag is gone)", () => {
    const next = turnStart(6);
    expect(next.players.player_1.kasteLuckSameTurnActivation).toBeUndefined();
    next.players.player_1.hand = [card("piecie_kannetje_melk")];
    const res = playPiecie(next, "player_1", card("piecie_kannetje_melk"));
    const placed = res.state.players.player_1.piecieSlots.find((s: any) => s !== null);
    expect(placed.canActivateOnTurn).toBe(next.turnNumber + 1);
  });

  it("the manual ability entry is a no-op passthrough", () => {
    const s = makeEngineState({});
    expect(ability_coert_kasteluck_morning_luck(s, "player_1")).toBe(s);
  });
});

describe("Coert KasteLuck data", () => {
  it("is an auto ability with the 2.0 text", () => {
    const k = MOSJES.find((m: any) => m.id === "mosje_coert_kasteluck");
    expect(k.autoAbility).toBe(true);
    expect(k.abilityDescription).toContain("4–6 draw 1 card");
  });
});
