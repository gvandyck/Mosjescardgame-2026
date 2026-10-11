import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { applyGetemt } from "../../src/engine/mp/applyGetemt.js";
// @ts-expect-error — JS module, no type declarations
import { loseMP } from "../../src/engine/mpManager.js";
// @ts-expect-error — JS module, no type declarations
import { checkVictory } from "../../src/engine/victoryChecker.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";

const def = MOSJES.find((m: any) => m.id === "mosje_gandoe_wizard");
const other = MOSJES.find((m: any) => m.id !== "mosje_gandoe_wizard");

function build(level: number, mp: number, mod?: (slot: any) => void) {
  const slot = createMosjeSlot(def, { level, mp });
  slot.entryProtected = false;
  if (mod) mod(slot);
  const foe = createMosjeSlot(other, { level: 1, mp: 50 });
  foe.entryProtected = false;
  return makeEngineState({
    players: { player_1: { activeSlots: [slot, null] }, player_2: { activeSlots: [foe, null] } },
  });
}

const slotOf = (s: any) => s.players.player_1.activeSlots[0];

describe("getemt (Obby 2.0 §2b)", () => {
  it("E4: L2 at 20 loses 30 -> L1 at 50 with level-1 traits", () => {
    const s = loseMP(build(2, 20), "player_1", 0, 30, "DRAIN");
    expect(slotOf(s).level).toBe(1);
    expect(slotOf(s).mp).toBe(50);
    expect(slotOf(s).traits).toEqual(def.levels[0].traits);
  });

  it("E4: L3 at 10 loses 10 -> L2 at 50", () => {
    const s = loseMP(build(3, 10), "player_1", 0, 10, "DRAIN");
    expect(slotOf(s).level).toBe(2);
    expect(slotOf(s).mp).toBe(50);
    expect(slotOf(s).traits).toEqual(def.levels[1].traits);
  });

  it("exactly 0 after a real loss does getemt: L2 at 15 loses 15 -> L1 at 50", () => {
    const s = loseMP(build(2, 15), "player_1", 0, 15, "DRAIN");
    expect(slotOf(s).level).toBe(1);
    expect(slotOf(s).mp).toBe(50);
  });

  it("E5: L1 at 10 loses 20 -> stays L1, MP 0, sideways", () => {
    const s = loseMP(build(1, 10), "player_1", 0, 20, "DRAIN");
    expect(slotOf(s).level).toBe(1);
    expect(slotOf(s).mp).toBe(0);
    expect(slotOf(s).sideways).toBe(true);
    expect(slotOf(s)._pendingWelloe).toBeUndefined();
  });

  it("E5: getemt while sideways -> flagged, then Welloe pile (not graveyard)", () => {
    let s = loseMP(build(1, 10), "player_1", 0, 20, "DRAIN");
    s = loseMP(s, "player_1", 0, 10, "DRAIN");
    expect(slotOf(s)._pendingWelloe).toBe(true);
    s = checkVictory(s);
    expect(slotOf(s)).toBeNull();
    expect(s.players.player_1.welloePile.map((c: any) => c.cardId)).toContain(def.id);
    expect(s.players.player_1.welloePile[0].source).toBe("welloe");
    expect(s.players.player_1.graveyard.some((c: any) => c.type === "MOSJE")).toBe(false);
  });

  it("E6: L1 at 0 MP, loss reduced to 0 -> no change, not sideways", () => {
    const s = loseMP(
      build(1, 0, (sl) => sl.statusEffects.push({ type: "MP_LOSS_REDUCTION", value: 20, turnsLeft: 2 })),
      "player_1", 0, 15, "DRAIN",
    );
    expect(slotOf(s).sideways).toBe(false);
    expect(slotOf(s).mp).toBe(0);
  });

  it("E6: L2 at 0 MP, loss reduced to 0 -> still L2 at 0", () => {
    const s = loseMP(
      build(2, 0, (sl) => sl.statusEffects.push({ type: "MP_LOSS_REDUCTION", value: 20, turnsLeft: 2 })),
      "player_1", 0, 15, "DRAIN",
    );
    expect(slotOf(s).level).toBe(2);
    expect(slotOf(s).mp).toBe(0);
  });

  it("WELLOE_SHIELD saves a sideways getemt Mosje (5 MP, on field, no Welloe pile)", () => {
    let s = build(1, 0, (sl) => {
      sl.sideways = true;
      sl.statusEffects.push({ type: "WELLOE_SHIELD", turnsLeft: 1 });
    });
    s = loseMP(s, "player_1", 0, 10, "DRAIN");
    s = checkVictory(s);
    expect(slotOf(s)).not.toBeNull();
    expect(slotOf(s).mp).toBe(5);
    expect(slotOf(s)._pendingWelloe).toBeUndefined();
    expect(s.players.player_1.welloePile).toHaveLength(0);
  });

  it("Not Today! saves a sideways getemt Mosje (5 MP, on field)", () => {
    let s = build(1, 0, (sl) => { sl.sideways = true; });
    s._snelleFlags = { negateNextElimination: { player_1: true } };
    s = loseMP(s, "player_1", 0, 10, "DRAIN");
    s = checkVictory(s);
    expect(slotOf(s)).not.toBeNull();
    expect(slotOf(s).mp).toBe(5);
    expect(s.players.player_1.welloePile).toHaveLength(0);
  });

  it("last Mosje to the Welloe pile -> opponent wins (KNOCKOUT)", () => {
    let s = build(1, 0, (sl) => { sl.sideways = true; });
    s = loseMP(s, "player_1", 0, 10, "DRAIN");
    s = checkVictory(s);
    expect(s.status).toBe("FINISHED");
    expect(s.winnerId).toBe("player_2");
    expect(s.winReason).toBe("KNOCKOUT");
  });

  it("tracking: totalDamageTaken and mpLostThisTurn add the final amount", () => {
    const s = loseMP(build(2, 50), "player_1", 0, 30, "DRAIN");
    expect(slotOf(s).mpLostThisTurn).toBe(30);
    expect(s.players.player_1.totalDamageTaken).toBe(30);
  });

  it("tracking records the FINAL amount when a reducer applies (30 halved -> 15)", () => {
    const s = loseMP(
      build(2, 50, (sl) => sl.statusEffects.push({ type: "MP_LOSS_HALVED", value: 1, turnsLeft: 1 })),
      "player_1", 0, 30, "DRAIN",
    );
    expect(slotOf(s).mpLostThisTurn).toBe(15);
    expect(s.players.player_1.totalDamageTaken).toBe(15);
  });

  it("plain loss within MP: no getemt", () => {
    const s = loseMP(build(2, 50), "player_1", 0, 20, "DRAIN");
    expect(slotOf(s).mp).toBe(30);
    expect(slotOf(s).level).toBe(2);
  });

  it("applyGetemt returns dropped / sideways / welloe", () => {
    expect(applyGetemt({ cardId: def.id, level: 2, mp: 0 })).toBe("dropped");
    expect(applyGetemt({ cardId: def.id, level: 1, mp: 0, sideways: false })).toBe("sideways");
    expect(applyGetemt({ cardId: def.id, level: 1, mp: 0, sideways: true })).toBe("welloe");
  });
});

// 54-13: Piecie MP losses go through applyMpLossToSlot (T-54-30: right owner).
// @ts-expect-error — JS module, no type declarations
import { activatePiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { makePiecieState } from "../helpers/makePiecieState.js";

describe("Piecie losses (54-13)", () => {
  it("Affoe on an opponent L2 at 10 -> opponent L1 at 50 (getemt)", () => {
    const st = makePiecieState({ piecieId: "piecie_affoe", foe: { level: 2, mp: 10 } });
    const r = activatePiecie(st, "player_1", 0);
    expect(r.success).toBe(true);
    const foe = r.state.players.player_2.activeSlots[0];
    expect([foe.level, foe.mp]).toEqual([1, 50]);
  });
  it("Affoe on a sideways L1 opponent at 10 -> opponent's Welloe pile", () => {
    const st = makePiecieState({
      piecieId: "piecie_affoe",
      foe: { level: 1, mp: 10 },
      foeMod: (sl: any) => { sl.sideways = true; },
    });
    const r = activatePiecie(st, "player_1", 0);
    expect(r.state.players.player_2.activeSlots[0]).toBeNull();
    expect(r.state.players.player_2.welloePile).toHaveLength(1);
    expect(r.state.players.player_1.welloePile).toHaveLength(0);
  });
});

// 54-14: ability and Quest losses run the pipeline and getemt.
// @ts-expect-error — JS module, no type declarations
import { resolveQuest } from "../../src/abilities/questLogic.js";
// @ts-expect-error — JS module, no type declarations
import { ability_coert_extra_resources } from "../../src/abilities/mosjeAbilities.js";

describe("ability / Quest losses (54-14)", () => {
  it("failed Quest taking an L2 Mosje to 0 -> L1 at 50", () => {
    const quest = { id: "q", type: "QUEST", questType: "GENERAL", successMP: 20, failMP: -20 };
    const st = resolveQuest(build(2, 20), "player_1", quest, false, 0);
    expect([slotOf(st).level, slotOf(st).mp]).toEqual([1, 50]);
  });
  it("ability cost (Coert pays 10) taking an L2 Mosje at 10 to 0 -> L1 at 50 (getemt)", () => {
    const st = ability_coert_extra_resources(build(2, 10), "player_1");
    expect([slotOf(st).level, slotOf(st).mp]).toEqual([1, 50]);
  });
  it("ability cost taking a Level 1 Mosje at 10 to 0 -> sideways at 0", () => {
    const st = ability_coert_extra_resources(build(1, 10), "player_1");
    expect([slotOf(st).level, slotOf(st).mp, slotOf(st).sideways]).toEqual([1, 0, true]);
  });
});
