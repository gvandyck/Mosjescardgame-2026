import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { markMosjeDefeated } from "../../src/engine/victoryChecker.js";
// @ts-expect-error — JS module, no type declarations
import { effect_laat_me_chillen } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error — JS module, no type declarations
import { effect_bowie_stormey } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error — JS module, no type declarations
import { effect_tony } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error — JS module, no type declarations
import { effect_gekke_vogels } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error — JS module, no type declarations
import { effect_katjegang } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error — JS module, no type declarations
import { effect_vianna_poes } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error — JS module, no type declarations
import { effect_mosje_shield } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error — JS module, no type declarations
import { effect_ff_haaltje_nemen } from "../../src/abilities/snelleEffects.js";

function makeState(mp: number, level: number, statusEffects: unknown[] = []) {
  return {
    activePlace: null,
    _snelleFlags: {},
    players: {
      p1: {
        totalDamageTaken: 0,
        activeSlots: [
          {
            cardId: "mosje_test",
            name: "Test",
            mp,
            level,
            isDefeated: false,
            traits: {},
            statusEffects: [...statusEffects],
            immuneThisTurn: false,
            mpLostThisTurn: 0,
          },
          null,
        ],
        welloe: [],
        questsCompleted: 0,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────
// TASK 1: MP_LOSS_HALVED and MP_LOSS_REDUCTION in loseMP()
// ─────────────────────────────────────────────────────────────

describe("loseMP — MP_LOSS_HALVED status effect", () => {
  it("Test 1: Mosje with MP_LOSS_HALVED active takes halved loss (Math.ceil), turnsLeft decrements", () => {
    const state = makeState(100, 1, [{ type: "MP_LOSS_HALVED", value: 1, turnsLeft: 1 }]);
    const result = loseMP(state, "p1", 0, 40);
    // Math.ceil(40 / 2) = 20 subtracted, 100 - 20 = 80
    expect(result.players.p1.activeSlots[0].mp).toBe(80);
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "MP_LOSS_HALVED"
    );
    expect(effect?.turnsLeft).toBe(0);
  });

  it("Test 2: Mosje with MP_LOSS_HALVED at turnsLeft=0 — full damage applied, NOT halved", () => {
    const state = makeState(100, 1, [{ type: "MP_LOSS_HALVED", value: 1, turnsLeft: 0 }]);
    const result = loseMP(state, "p1", 0, 40);
    // Effect is expired — full 40 damage
    expect(result.players.p1.activeSlots[0].mp).toBe(60);
  });
});

describe("loseMP — MP_LOSS_REDUCTION status effect", () => {
  it("Test 3: Mosje with MP_LOSS_REDUCTION value:20 — loss reduced by 20, turnsLeft decrements", () => {
    const state = makeState(100, 1, [{ type: "MP_LOSS_REDUCTION", value: 20, turnsLeft: 1 }]);
    const result = loseMP(state, "p1", 0, 30);
    // 30 - 20 = 10 subtracted, 100 - 10 = 90
    expect(result.players.p1.activeSlots[0].mp).toBe(90);
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "MP_LOSS_REDUCTION"
    );
    expect(effect?.turnsLeft).toBe(0);
  });

  it("Test 4: MP_LOSS_REDUCTION with loss less than value — floors at 0 (no negative loss)", () => {
    const state = makeState(100, 1, [{ type: "MP_LOSS_REDUCTION", value: 20, turnsLeft: 1 }]);
    const result = loseMP(state, "p1", 0, 10);
    // 10 - 20 = -10, clamped to 0, Mosje takes 0 damage
    expect(result.players.p1.activeSlots[0].mp).toBe(100);
  });
});

describe("loseMP — snelleFlags.mpLossReduction (Protector flag)", () => {
  it("Test 5: snelleFlags.mpLossReduction[playerId]=30 — loss reduced by 30, flag deleted after use", () => {
    const state = makeState(100, 1);
    (state as any)._snelleFlags = { mpLossReduction: { p1: 30 } };
    const result = loseMP(state, "p1", 0, 50);
    // 50 - 30 = 20 subtracted, 100 - 20 = 80
    expect(result.players.p1.activeSlots[0].mp).toBe(80);
    expect((result as any)._snelleFlags?.mpLossReduction?.p1).toBeUndefined();
  });
});

describe("piecieEffects — push site value checks for Task 1", () => {
  it("Test 6: effect_laat_me_chillen — pushed MP_LOSS_REDUCTION has value:20, not 0", () => {
    const state = makeState(100, 1);
    const result = effect_laat_me_chillen(state, "p1");
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "MP_LOSS_REDUCTION"
    );
    expect(effect).toBeDefined();
    expect(effect?.value).toBe(20);
  });

  it("Test 7a: effect_bowie_stormey — pushed MP_LOSS_HALVED has value:1, not 0", () => {
    const state = makeState(100, 1);
    const result = effect_bowie_stormey(state, "p1");
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "MP_LOSS_HALVED"
    );
    expect(effect).toBeDefined();
    expect(effect?.value).toBe(1);
  });

  it("Test 7b: effect_tony — pushed MP_LOSS_HALVED has value:1, not 0", () => {
    const state = makeState(100, 1);
    const result = effect_tony(state, "p1");
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "MP_LOSS_HALVED"
    );
    expect(effect).toBeDefined();
    expect(effect?.value).toBe(1);
  });

  it("Test 7c: effect_gekke_vogels — pushed MP_LOSS_HALVED has value:1, not 0", () => {
    const state = makeState(100, 1);
    const result = effect_gekke_vogels(state, "p1");
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "MP_LOSS_HALVED"
    );
    expect(effect).toBeDefined();
    expect(effect?.value).toBe(1);
  });

  it("Test 7d: effect_katjegang — pushed MP_LOSS_HALVED has value:1, not 0", () => {
    const state = makeState(100, 1);
    const result = effect_katjegang(state, "p1");
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "MP_LOSS_HALVED"
    );
    expect(effect).toBeDefined();
    expect(effect?.value).toBe(1);
  });

  it("Test 7e: effect_vianna_poes — pushed MP_LOSS_HALVED has value:1, not 0", () => {
    const state = makeState(100, 1);
    const result = effect_vianna_poes(state, "p1");
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "MP_LOSS_HALVED"
    );
    expect(effect).toBeDefined();
    expect(effect?.value).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────
// TASK 2: WELLOE_SHIELD in markMosjeDefeated() + ff_haaltje_nemen fix
// ─────────────────────────────────────────────────────────────

describe("markMosjeDefeated — WELLOE_SHIELD status effect", () => {
  it("Test 8: WELLOE_SHIELD active (turnsLeft:1) — Mosje NOT sent to Welloe; mp set to 1, turnsLeft decrements", () => {
    const state = makeState(0, 1, [{ type: "WELLOE_SHIELD", value: 1, turnsLeft: 1 }]);
    const result = markMosjeDefeated(state, "p1", 0);
    // Slot still exists (not set to null)
    expect(result.players.p1.activeSlots[0]).not.toBeNull();
    expect(result.players.p1.activeSlots[0].mp).toBe(1);
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "WELLOE_SHIELD"
    );
    expect(effect?.turnsLeft).toBe(0);
  });

  it("Test 9: WELLOE_SHIELD at turnsLeft:0 — Mosje IS sent to Welloe (normal defeat)", () => {
    const state = makeState(0, 1, [{ type: "WELLOE_SHIELD", value: 1, turnsLeft: 0 }]);
    const result = markMosjeDefeated(state, "p1", 0);
    // Normal defeat: slot set to null, Mosje in welloe
    expect(result.players.p1.activeSlots[0]).toBeNull();
    expect(result.players.p1.welloe).toHaveLength(1);
  });

  it("Test 10: WELLOE_SHIELD AND negateNextElimination both set — WELLOE_SHIELD fires first", () => {
    const state = makeState(0, 1, [{ type: "WELLOE_SHIELD", value: 1, turnsLeft: 1 }]);
    (state as any)._snelleFlags = { negateNextElimination: { p1: true } };
    const result = markMosjeDefeated(state, "p1", 0);
    // WELLOE_SHIELD fires first: mp set to 1, negate flag still present
    expect(result.players.p1.activeSlots[0]).not.toBeNull();
    expect(result.players.p1.activeSlots[0].mp).toBe(1);
  });
});

describe("piecieEffects — effect_mosje_shield push site value", () => {
  it("Test 13: effect_mosje_shield — pushed WELLOE_SHIELD has value:1, not 0", () => {
    const state = makeState(100, 1);
    const result = effect_mosje_shield(state, "p1");
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "WELLOE_SHIELD"
    );
    expect(effect).toBeDefined();
    expect(effect?.value).toBe(1);
  });
});

describe("snelleEffects — effect_ff_haaltje_nemen", () => {
  it("Test 11: resilient=0 — pushed MP_LOSS_REDUCTION has value:20", () => {
    const state = makeState(100, 1);
    const result = effect_ff_haaltje_nemen(state, "p1");
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "MP_LOSS_REDUCTION"
    );
    expect(effect).toBeDefined();
    expect(effect?.value).toBe(20);
  });

  it("Test 12: resilient=2 — pushed MP_LOSS_REDUCTION has value:30", () => {
    const state = makeState(100, 1);
    // Override traits on the mosje
    (state as any).players.p1.activeSlots[0].traits = { resilient: 2 };
    const result = effect_ff_haaltje_nemen(state, "p1");
    const effect = result.players.p1.activeSlots[0].statusEffects.find(
      (e: any) => e.type === "MP_LOSS_REDUCTION"
    );
    expect(effect).toBeDefined();
    expect(effect?.value).toBe(30);
  });
});
