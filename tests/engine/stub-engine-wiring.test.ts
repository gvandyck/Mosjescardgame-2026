import { describe, expect, it, beforeAll } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { markMosjeDefeated } from "../../src/engine/victoryChecker.js";
// @ts-expect-error — JS module, no type declarations
import { phaseDrawCard, useMosjeAbility } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
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
        energy: 6,
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
        graveyard: [],
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

describe("loseMP — reactionMods reduce entry (The Protector)", () => {
  it("Test 5: a reduce entry of 30 on the slot — loss reduced by 30, entry consumed", () => {
    const state = makeState(100, 1);
    (state as any).reactionMods = [{ kind: "reduce", playerId: "p1", slotIndex: 0, amount: 30 }];
    const result = loseMP(state, "p1", 0, 50);
    // 50 - 30 = 20 subtracted, 100 - 20 = 80
    expect(result.players.p1.activeSlots[0].mp).toBe(80);
    expect((result as any).reactionMods).toHaveLength(0);
  });
});

describe("piecieEffects — push site value checks for Task 1", () => {
  const withEntry = (state: any) => {
    state.players.p1.piecieSlots = [{ cardId: "piecie_x", type: "PIECIE", faceDown: false, activated: true }, null, null, null];
    return state;
  };
  it("Test 6: effect_laat_me_chillen (Card List 2.0) — the Stays entry carries lossReduceOnce 20", () => {
    const result = effect_laat_me_chillen(withEntry(makeState(100, 1)), "p1", { slotIndex: 0 });
    expect(result.players.p1.piecieSlots[0].lossReduceOnce).toBe(20);
  });

  it("Test 7a: effect_bowie_stormey (Card List 2.0) — a non-named Mosje is covered 10 less per loss", () => {
    const result = effect_bowie_stormey(withEntry(makeState(100, 1)), "p1", { slotIndex: 0 });
    const cover = result.players.p1.piecieSlots[0].boundTo;
    expect(cover).toHaveLength(1);
    expect(cover[0]).toMatchObject({ slotIndex: 0, reduce: 10 });
  });

  it("Test 7b: effect_tony (Card List 2.0) — a non-named Mosje is covered 10 less per loss", () => {
    const result = effect_tony(withEntry(makeState(100, 1)), "p1", { slotIndex: 0 });
    expect(result.players.p1.piecieSlots[0].boundTo[0]).toMatchObject({ slotIndex: 0, reduce: 10 });
  });

  it("Test 7c: effect_gekke_vogels (Card List 2.0) — a non-named Mosje is covered 10 less per loss", () => {
    const result = effect_gekke_vogels(withEntry(makeState(100, 1)), "p1", { slotIndex: 0 });
    expect(result.players.p1.piecieSlots[0].boundTo[0]).toMatchObject({ slotIndex: 0, reduce: 10 });
  });

  it("Test 7d: effect_katjegang (Card List 2.0) — a non-named Mosje is covered 10 less per loss", () => {
    const result = effect_katjegang(withEntry(makeState(100, 1)), "p1", { slotIndex: 0 });
    expect(result.players.p1.piecieSlots[0].boundTo[0]).toMatchObject({ slotIndex: 0, reduce: 10 });
  });

  it("Test 7e: effect_vianna_poes (Card List 2.0) — a non-Cless Mosje is covered 10 less per loss", () => {
    const result = effect_vianna_poes(withEntry(makeState(100, 1)), "p1", { slotIndex: 0 });
    expect(result.players.p1.piecieSlots[0].boundTo[0]).toMatchObject({ slotIndex: 0, reduce: 10 });
  });
});

// ─────────────────────────────────────────────────────────────
// TASK 2: WELLOE_SHIELD in markMosjeDefeated() + ff_haaltje_nemen fix
// ─────────────────────────────────────────────────────────────

const shieldEntry = (cardId = "mosje_gandoe_wizard") => ({
  cardId: "piecie_mosje_shield", type: "PIECIE", stays: true, staysEnd: "endOfNextTurn",
  boundTo: [{ playerId: "p1", slotIndex: 0, cardId, reduce: 0, shield: true }],
});

describe("markMosjeDefeated - Mosje Shield (bound Stays entry)", () => {
  it("Test 8: a staying Mosje Shield bound to the Mosje - NOT sent to Welloe; mp set to 5, card stays", () => {
    const state = makeState(0, 1);
    const id = state.players.p1.activeSlots[0].cardId;
    (state.players.p1 as any).piecieSlots = [shieldEntry(id)];
    const result = markMosjeDefeated(state, "p1", 0);
    expect(result.players.p1.activeSlots[0]).not.toBeNull();
    expect(result.players.p1.activeSlots[0].mp).toBe(5);
    expect((result.players.p1 as any).piecieSlots[0]?.cardId).toBe("piecie_mosje_shield");
  });

  it("Test 9: no shield (or one bound to another Mosje) - Mosje IS sent to the Welloe pile", () => {
    const state = makeState(0, 1);
    (state.players.p1 as any).piecieSlots = [shieldEntry("mosje_someone_else")];
    const result = markMosjeDefeated(state, "p1", 0);
    expect(result.players.p1.activeSlots[0]).toBeNull();
    const welloeMosjes = ((result.players.p1 as any).welloePile as any[]).filter((e: any) => e.type === 'MOSJE'); expect(welloeMosjes).toHaveLength(1);
    expect((result.players.p1.graveyard as any[]).filter((e: any) => e.type === 'MOSJE')).toHaveLength(0);
  });

  it("Test 10: Mosje Shield AND a Not Today! save entry - the shield fires first, the entry is kept", () => {
    const state = makeState(0, 1);
    (state.players.p1 as any).piecieSlots = [shieldEntry(state.players.p1.activeSlots[0].cardId)];
    (state as any).reactionMods = [{ kind: "save", playerId: "p1", slotIndex: 0 }];
    const result = markMosjeDefeated(state, "p1", 0);
    expect(result.players.p1.activeSlots[0]).not.toBeNull();
    expect(result.players.p1.activeSlots[0].mp).toBe(5);
    expect((result as any).reactionMods).toHaveLength(1);
  });
});

describe("piecieEffects - effect_mosje_shield", () => {
  it("Test 13: binds the staying card to the chosen Mosje (no status effect)", () => {
    const state: any = makeState(100, 1);
    state.players.p1.piecieSlots = [{ cardId: "piecie_mosje_shield", type: "PIECIE" }];
    const result = effect_mosje_shield(state, "p1", { slotIndex: 0 });
    const b = result.players.p1.piecieSlots[0].boundTo[0];
    expect(b).toMatchObject({ playerId: "p1", slotIndex: 0, shield: true });
    expect(result.players.p1.activeSlots[0].statusEffects.some((e: any) => e.type === "WELLOE_SHIELD")).toBe(false);
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

// ─────────────────────────────────────────────────────────────
// TASK 1 (Wave 2): negateNextSearch in phaseDrawCard (STUB-04)
// ─────────────────────────────────────────────────────────────

function makeDrawState() {
  return {
    activePlace: null,
    _snelleFlags: {},
    players: {
      p1: {
        deck: [{ cardId: "test_card_1" }, { cardId: "test_card_2" }],
        hand: [],
        discard: [],
        drawsThisTurn: 0,
        activeSlots: [
          {
            cardId: "mosje_test",
            name: "Test",
            mp: 100,
            level: 1,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            immuneThisTurn: false,
            mpLostThisTurn: 0,
          },
          null,
        ],
        graveyard: [],
        questsCompleted: 0,
      },
      p2: {
        deck: [{ cardId: "test_card_3" }],
        hand: [],
        discard: [],
        drawsThisTurn: 0,
        activeSlots: [
          {
            cardId: "mosje_test2",
            name: "Test2",
            mp: 100,
            level: 1,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            immuneThisTurn: false,
            mpLostThisTurn: 0,
          },
          null,
        ],
        graveyard: [],
        questsCompleted: 0,
      },
    },
  };
}

describe("phaseDrawCard — opponent-triggered draws (STUB-04)", () => {
  // The V4 negateNextSearch flag is gone (Phase 60: Jammertje Gepakt! now cancels a Piecie, see snelle-cancel-copy.test.ts).
  it("Test 15: natural turn draw draws normally", () => {
    const result = phaseDrawCard(makeDrawState(), "p1", 1);
    expect(result.players.p1.hand).toHaveLength(1);
  });

  it("Test 16: an opponent-triggered draw happens normally", () => {
    const result = phaseDrawCard(makeDrawState(), "p1", 1, true);
    expect(result.players.p1.hand).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────
// WAVE 3: STUB-09 Dierenasiel 0-MP guard in useMosjeAbility()
// ─────────────────────────────────────────────────────────────

function makeAbilityState(mp: number, extraStateProps: Record<string, unknown> = {}) {
  return {
    activePlayerId: "p1",
    activePlace: null,
    dierenasielActive: false,
    _snelleFlags: {},
    _pendingTargets: {},
    players: {
      p1: {
        energy: 6,
        totalDamageTaken: 0,
        hand: [],
        deck: [{ cardId: "test_card_1" }, { cardId: "test_card_2" }],
        discard: [],
        drawsThisTurn: 0,
        questsCompleted: 0,
        questsAttempted: 0,
        level: 1,
        questBonusMP: 0,
        piecieSlots: [null, null, null, null],
        graveyard: [],
        activeSlots: [
          {
            cardId: "mosje_tuk_healer",
            name: "[Gandoe] The Unpredictable Wizard",
            subtype: "FIGHTING",
            traits: { physical: 2, resilient: 1, creative: 2 },
            mp,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
            immuneThisTurn: false,
            mpLostThisTurn: 0,
          },
          null,
        ],
      },
    },
    ...extraStateProps,
  };
}

describe("useMosjeAbility — Dierenasiel 0-MP guard (STUB-09, dead waiver removed Phase 35-03)", () => {
  it("Test 18: useMosjeAbility() with Mosje at 0 MP and no engine cost gate — returns success:true (no regression)", () => {
    // Tuk Healer (Gandoe Wizard became a trigger in 2.0) has no MP cost, ability does not check mp
    // Confirms engine does not block activation at 0 MP
    const state = makeAbilityState(0);
    const result = (useMosjeAbility as any)(state, "p1", "mosje_tuk_healer");
    expect(result.success).toBe(true);
  });

  it("Test 19: useMosjeAbility() with dierenasielActive=true — returns success:true, does not throw", () => {
    const state = makeAbilityState(0, { dierenasielActive: true });
    let result: any;
    expect(() => {
      result = (useMosjeAbility as any)(state, "p1", "mosje_tuk_healer");
    }).not.toThrow();
    expect(result.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// WAVE 3: STUB-10 Synergy Chamber cost reduction in useMosjeAbility()
// ─────────────────────────────────────────────────────────────

function makeCoertAbilityState(mp: number, activePlace: string | null = null) {
  return {
    activePlayerId: "p1",
    activePlace,
    dierenasielActive: false,
    _snelleFlags: {},
    _pendingTargets: {},
    players: {
      p1: {
        energy: 6,
        totalDamageTaken: 0,
        hand: [],
        deck: [{ cardId: "test_card_1" }, { cardId: "test_card_2" }],
        discard: [],
        drawsThisTurn: 0,
        questsCompleted: 0,
        questsAttempted: 0,
        level: 1,
        questBonusMP: 0,
        piecieSlots: [null, null, null, null],
        graveyard: [],
        activeSlots: [
          {
            cardId: "mosje_coert_tech",
            name: "[Coert] The Hawaiian Tech Savant",
            subtype: "DIGITAL",
            traits: { mental: 2, technical: 3, social: 1 },
            mp,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
            immuneThisTurn: false,
            mpLostThisTurn: 0,
          },
          null,
        ],
      },
    },
  };
}

describe("useMosjeAbility — Synergy Chamber cost reduction removed (Phase 35-06)", () => {
  it("Test 20: Synergy Chamber active, Coert with 0 Energy (cost 1 Energy, no discount) — success:false", () => {
    // 2.0: the ability costs 1 Energy; Synergy Chamber gives no discount. MP is never spent.
    const state = makeCoertAbilityState(8, "place_synergy_chamber");
    state.players.p1.activeSlots[0].cardId = "mosje_fps_west"; // Coert Tech is a draw-step option now; FPS West pays 1 Energy
    state._pendingTargets = { card_type: "PIECIE" };
    state.players.p1.energy = 0;
    const result = (useMosjeAbility as any)(state, "p1", "mosje_fps_west");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not enough Energy");
  });

  it("Test 21: Coert at 10 MP with 1 Energy — success, pays 1 Energy, MP unchanged", () => {
    // 2.0: low MP no longer blocks the ability; Energy pays, MP is untouched (10 is on the 5-grid).
    const state = makeCoertAbilityState(10, null);
    state.players.p1.activeSlots[0].cardId = "mosje_fps_west";
    state._pendingTargets = { card_type: "PIECIE" };
    state.players.p1.energy = 1;
    const result = (useMosjeAbility as any)(state, "p1", "mosje_fps_west");
    expect(result.success).toBe(true);
    expect(result.state.players.p1.energy).toBe(0);
    expect(result.state.players.p1.activeSlots[0].mp).toBe(10);
  });
});
