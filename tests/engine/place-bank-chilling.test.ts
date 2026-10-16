import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { startTurn } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module, no type declarations
import { mkSlot } from "../helpers/quest56.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

// Bank Chilling (Obby 2.0): at the start of each player's turn, that player's Social 2+ Mosjes gain 10 MP.
// Goes through the real startTurn path (a dead-dispatch regression would show here).
const ming = () => MOSJES.find((m: any) => m.id === "mosje_ming_natural");
const social = (n: number, mp: number, over: any = {}) => { const s = mkSlot({ mp, ...over }, ming()); s.traits.social = n; return s; };
const build = (p1: any[], p2: any[] = [social(3, 30)]) => makeEngineState({
  turnNumber: 5, activePlayerId: "player_1", activePlace: "place_bank_chilling", activePlacePlayedBy: "player_1",
  players: {
    player_1: { deck: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }], activeSlots: p1 },
    player_2: { deck: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }], activeSlots: p2 },
  },
});

describe("Bank Chilling — turn start", () => {
  it("every Social 2+ Mosje of the turn player gains 10 MP, not just the first slot", () => {
    const next = startTurn(build([social(2, 20), social(3, 30)]));
    expect(next.players.player_1.activeSlots.map((s: any) => s.mp)).toEqual([30, 40]);
  });
  it("Social 1, a fresh Social 3 and the opponent's Mosjes do not gain", () => {
    const next = startTurn(build([social(1, 20), social(3, 20, { entryProtected: true })]));
    expect(next.players.player_1.activeSlots.map((s: any) => s.mp)).toEqual([20, 20]);
    expect(next.players.player_2.activeSlots[0].mp).toBe(30);
  });
});
