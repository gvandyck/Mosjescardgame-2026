import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error — JS module, no type declarations
import { drawPack } from "../../src/data/boosterEngine.js";
// @ts-expect-error — JS module, no type declarations
import { getStarterEligible } from "../../src/data/cardIndex.js";

// ─────────────────────────────────────────────────────────────
// 2026-07-12 ability-text-engine-reconciliation todo — cards 7-8/10
// Coert Kastelein ("too conceptual still") and Drainer (placeholder, same reason)
// are hidden from the game entirely per Gandoe's ruling. Data stays in mosjes.js
// (disabled: true), recoverable later by flipping the flag — but must never be
// obtainable from boosters, visible in the deck-builder pool, or starter-eligible.
// ─────────────────────────────────────────────────────────────

const HIDDEN_IDS = ["mosje_coert_kastelein", "mosje_drainer"];

describe("Hidden cards — data flag", () => {
  it("both cards are marked disabled: true", () => {
    for (const id of HIDDEN_IDS) {
      const card = MOSJES.find((m: any) => m.id === id);
      expect(card, `${id} should still exist in MOSJES`).toBeTruthy();
      expect(card.disabled, `${id}.disabled`).toBe(true);
    }
  });
});

describe("Hidden cards — booster pool (boosterEngine.js)", () => {
  it("never drops a disabled card across many draws", () => {
    // 500 draws is comfortably enough to catch a leak — Coert Kastelein alone is
    // ★★★★ (weight 4) out of a pool with hundreds of total weight, so even a rare
    // card would show up at least once if the filter were broken.
    const drawn = drawPack(500);
    for (const card of drawn) {
      expect(HIDDEN_IDS).not.toContain(card.id);
    }
  });
});

describe("Hidden cards — starter-eligible pool (cardIndex.js)", () => {
  it("getStarterEligible('MOSJE') excludes both hidden cards", () => {
    const eligible = getStarterEligible("MOSJE");
    const eligibleIds = eligible.map((c: any) => c.id);
    for (const id of HIDDEN_IDS) {
      expect(eligibleIds).not.toContain(id);
    }
  });
});
