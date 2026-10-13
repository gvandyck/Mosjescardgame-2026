// Coert, The Hawaiian Tech Savant — Extra Resources (Card List 2.0): during your draw, pay 1 Energy to draw
// 1 extra card, up to 2 times per turn. A draw-step option, never an Activate button.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module
import { startTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error - JS module
import { finishDrawStep } from "../../src/engine/mosje/finishDrawStep.js";
// @ts-expect-error - JS module
import { makeEngineState } from "../helpers/makeEngineState.js";

const ID = "mosje_coert_tech";
const mosje = (extra: any = {}) => ({ cardId: ID, name: "Coert", mp: 30, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false, ...extra });
const cards = (n: number) => Array.from({ length: n }, (_, i) => ({ cardId: `c${i}`, type: "PIECIE" }));
function turnStart(energy: number, slot: any = mosje(), deck: any[] = cards(6)) {
  return startTurn(makeEngineState({
    turnNumber: 3,
    players: { player_1: { energy, deck, activeSlots: [slot, null] }, player_2: { activeSlots: [mosje({ cardId: "mosje_x" }), null] } },
  }));
}
const use = (s: any, extra: number) => finishDrawStep(s, "player_1", { use: [ID], [ID]: { extra } });

describe("Coert Tech draw step", () => {
  it("pauses the draw step with a Coert option", () => {
    expect(turnStart(3).pendingDrawStep.options).toEqual([{ mosjeId: ID }]);
  });
  it("2 extra: normal draw + 2 cards, Energy -2 (after the +1 turn gain)", () => {
    const r = use(turnStart(3), 2);
    expect(r.ok).toBe(true);
    const p = r.state.players.player_1;
    expect(p.hand).toHaveLength(3);
    expect(p.deck).toHaveLength(3);
    expect(p.energy).toBe(2); // 3 + 1 - 2
  });
  it("never more than 2 extra, even if asked for 5", () => {
    const r = use(turnStart(5), 5);
    expect(r.state.players.player_1.hand).toHaveLength(3);
    expect(r.state.players.player_1.energy).toBe(4); // 5 + 1 (cap 6) - 2
  });
  it("with only 1 Energy left after the turn gain, only 1 extra card even when 2 are asked", () => {
    const r = use(turnStart(0), 2);
    expect(r.state.players.player_1.hand).toHaveLength(2);
    expect(r.state.players.player_1.energy).toBe(0);
  });
  it("drawing normally costs nothing", () => {
    const r = finishDrawStep(turnStart(3), "player_1", {});
    expect(r.state.players.player_1.hand).toHaveLength(1);
    expect(r.state.players.player_1.energy).toBe(4);
  });
  it("an empty deck draws nothing and costs nothing", () => {
    const r = use(turnStart(3, mosje(), []), 2);
    expect(r.state.players.player_1.energy).toBe(4);
  });
  it("a sideways Coert offers no option; no Coert offers no option", () => {
    expect(turnStart(3, mosje({ sideways: true })).pendingDrawStep).toBeUndefined();
    expect(turnStart(3, mosje({ cardId: "mosje_x" })).pendingDrawStep).toBeUndefined();
  });
});
