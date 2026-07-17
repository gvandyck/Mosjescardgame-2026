// Alyssa <-> Jisca synergy detection (Phase 38, D-01..D-05).
// hasAlyssaJiscaSynergy is a specific detection helper — modeled on
// hasFoodDoubleSynergy — that reports whether Jisca is paired with EITHER
// Alyssa variant on a player's field. This is a RED test until Task 3 adds
// the export to src/engine/synergyResolver.js (Task 1 of 38-01-PLAN.md).
//
// It reuses hasSynergy/getActiveSynergies (already honors both-on-field OR
// synergyWaiverActive) — no new slot-iteration logic.
import { describe, expect, it } from "vitest";
// @ts-expect-error - JS module, no type declarations
import { hasAlyssaJiscaSynergy } from "../../src/engine/synergyResolver.js";

function makeSlot(cardId: string, mp = 20) {
  return {
    cardId, name: cardId, subtype: "ARTISTIC", traits: {}, mp, level: 0,
    isDefeated: false, statusEffects: [] as any[], abilityUsedThisTurn: false,
  };
}
function makeState(p1Mosjes: (ReturnType<typeof makeSlot> | null)[]) {
  return {
    status: "ACTIVE", activePlayerId: "player_1", turnNumber: 3,
    players: {
      player_1: { name: "P1", hand: [], deck: [], graveyard: [], activeSlots: p1Mosjes, piecieSlots: [null, null, null, null] },
      player_2: { name: "P2", hand: [], deck: [], graveyard: [], activeSlots: [makeSlot("mosje_binti"), null], piecieSlots: [null, null, null, null] },
    },
  } as any;
}

describe("hasAlyssaJiscaSynergy", () => {
  it("true for Jisca + Alyssa Bulldozer", () => {
    const state = makeState([makeSlot("mosje_jisca"), makeSlot("mosje_alyssa_bulldozer")]);
    expect(hasAlyssaJiscaSynergy(state, "player_1")).toBe(true);
  });

  it("true for Jisca + Alyssa Fissa Fissa!", () => {
    const state = makeState([makeSlot("mosje_jisca"), makeSlot("mosje_alyssa_fissa")]);
    expect(hasAlyssaJiscaSynergy(state, "player_1")).toBe(true);
  });

  it("false for Jisca alone", () => {
    const state = makeState([makeSlot("mosje_jisca"), null]);
    expect(hasAlyssaJiscaSynergy(state, "player_1")).toBe(false);
  });

  it("false for Alyssa Bulldozer alone", () => {
    const state = makeState([makeSlot("mosje_alyssa_bulldozer"), null]);
    expect(hasAlyssaJiscaSynergy(state, "player_1")).toBe(false);
  });

  it("false for Alyssa Fissa Fissa! alone", () => {
    const state = makeState([makeSlot("mosje_alyssa_fissa"), null]);
    expect(hasAlyssaJiscaSynergy(state, "player_1")).toBe(false);
  });

  it("false when Jisca is defeated even with an Alyssa present", () => {
    const deadJisca = { ...makeSlot("mosje_jisca"), isDefeated: true };
    const state = makeState([deadJisca, makeSlot("mosje_alyssa_bulldozer")]);
    expect(hasAlyssaJiscaSynergy(state, "player_1")).toBe(false);
  });
});
