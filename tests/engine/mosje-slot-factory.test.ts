import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { getLevelRow } from "../../src/engine/mp/getLevelRow.js";
// @ts-expect-error — JS module, no type declarations
import { refreshLevelTraits } from "../../src/engine/mp/refreshLevelTraits.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error — JS module, no type declarations
import { createInitialGameState } from "../../src/engine/gameState.js";
// @ts-expect-error — JS module, no type declarations
import { playMosje } from "../../src/engine/turnManager.js";

const def = MOSJES.find((m: any) => m.id === "mosje_gandoe_wizard");

describe("createMosjeSlot", () => {
  it("creates a Level 1 slot with startMP and level-1 traits", () => {
    const s = createMosjeSlot(def);
    expect(s.level).toBe(1);
    expect(s.mp).toBe(def.startMP);
    expect(s.sideways).toBe(false);
    expect(s.entryProtected).toBe(true);
    expect(s.traits).toEqual(def.levels[0].traits);
  });
  it("honours level and mp options and uses that level's traits", () => {
    const s = createMosjeSlot(def, { level: 2, mp: 50 });
    expect(s.level).toBe(2);
    expect(s.mp).toBe(50);
    expect(s.traits).toEqual(def.levels[1].traits);
  });
  it("clamps level into 1..3", () => {
    expect(createMosjeSlot(def, { level: 0 }).level).toBe(1); // level0-ok: Level 0 input is normalised to 1
    expect(createMosjeSlot(def, { level: 7 }).level).toBe(3);
  });
  it("floors mp at 0 and rounds to the 5-grid", () => {
    expect(createMosjeSlot(def, { mp: -5 }).mp).toBe(0);
    expect(createMosjeSlot(def, { mp: 12 }).mp).toBe(10);
  });
});

describe("getLevelRow / refreshLevelTraits", () => {
  it("returns the level row and null for unknown cards", () => {
    expect(getLevelRow("mosje_gandoe_wizard", 2).power).toBe(20);
    expect(getLevelRow("nope", 1)).toBeNull();
  });
  it("refreshes traits from the current level row", () => {
    const s = createMosjeSlot(def);
    s.level = 3;
    refreshLevelTraits(s);
    expect(s.traits).toEqual(def.levels[2].traits);
  });
});

describe("creators use the factory", () => {
  it("every starting slot is Level 1", () => {
    const st = createInitialGameState(
      [
        { playerId: "p1", name: "A", deckId: "DIGITAL_CONTROL" },
        { playerId: "p2", name: "B", deckId: "PHYSICAL_FORCE" },
      ],
      "T",
    );
    for (const p of Object.values(st.players) as any[]) {
      for (const s of p.activeSlots) if (s) expect(s.level).toBe(1);
    }
  });
  it("playMosje creates a Level 1 slot at startMP", () => {
    const st = createInitialGameState(
      [
        { playerId: "p1", name: "A", deckId: "DIGITAL_CONTROL" },
        { playerId: "p2", name: "B", deckId: "PHYSICAL_FORCE" },
      ],
      "T",
    );
    const p = st.players.p1;
    p.activeSlots = [null, null];
    p.hand = [{ cardId: def.id, type: "MOSJE" }];
    const r = playMosje(st, "p1", { cardId: def.id });
    expect(r.success).toBe(true);
    const slot = r.state.players.p1.activeSlots[r.slotIndex];
    expect(slot.level).toBe(1);
    expect(slot.mp).toBe(def.startMP);
  });
});
