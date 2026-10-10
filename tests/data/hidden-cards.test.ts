import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
// @ts-ignore JS module
import { HIDDEN_CARD_IDS } from "../../scripts/obby2/hiddenCardIds.mjs";
// @ts-ignore JS module
import { ALL_CARDS } from "../../src/data/cardIndex.js";
// @ts-ignore JS module
import { drawPack } from "../../src/data/boosterEngine.js";
// @ts-ignore JS module
import { getStarterEligible } from "../../src/data/cardIndex.js";
// @ts-ignore JS module
import { getPlayerFacingPlaces } from "../../src/data/playerFacingPlaces.js";

// Obby 2.0 (Phase 53-06): 15 parked/cut cards are hidden with the shared `disabled: true`
// flag. Data stays in src/data; they must never reach boosters, starter lists,
// player-facing Places or the deck builder. mosje_drainer is a Card List card again.

const HIDDEN_IDS: string[] = HIDDEN_CARD_IDS;
const byId = (id: string) => (ALL_CARDS as any[]).find((c) => c.id === id);

describe("Hidden cards — data flag", () => {
  it("lists exactly 15 ids", () => expect(new Set(HIDDEN_IDS).size).toBe(15));

  for (const id of HIDDEN_IDS) {
    it(`${id} still exists and is disabled`, () => {
      expect(byId(id), `${id} should still exist`).toBeTruthy();
      expect(byId(id).disabled).toBe(true);
    });
  }

  it("mosje_drainer exists and is NOT disabled", () => {
    expect(byId("mosje_drainer")).toBeTruthy();
    expect(byId("mosje_drainer").disabled).toBeFalsy();
  });

  it("no other card is disabled", () => {
    const extra = (ALL_CARDS as any[]).filter((c) => c.disabled && !HIDDEN_IDS.includes(c.id));
    expect(extra.map((c) => c.id)).toEqual([]);
  });
});

describe("Hidden cards — booster pool", () => {
  it("never drops a hidden card across 1000 draws", () => {
    for (const card of drawPack(1000)) expect(HIDDEN_IDS).not.toContain(card.id);
  });
});

describe("Hidden cards — starter-eligible pool", () => {
  for (const type of ["MOSJE", "PIECIE", "SNELLE_PIECIE", "PLACE", "QUEST"]) {
    it(`getStarterEligible('${type}') excludes hidden cards`, () => {
      const ids = getStarterEligible(type).map((c: any) => c.id);
      for (const id of HIDDEN_IDS) expect(ids).not.toContain(id);
    });
  }
});

describe("Hidden cards — player-facing Places and deck builder", () => {
  it("getPlayerFacingPlaces excludes Momentum Factory, includes Drain Zone and The Void", () => {
    const ids = getPlayerFacingPlaces().map((p: any) => p.id);
    expect(ids).not.toContain("place_momentum_factory");
    expect(ids).toContain("place_drain_zone");
    expect(ids).toContain("place_the_void");
  });

  it("deck-builder.js filters on !c.disabled (static guard; module needs Firebase)", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../../src/deck-builder.js"), "utf8");
    expect(src).toContain("!c.disabled");
  });
});
