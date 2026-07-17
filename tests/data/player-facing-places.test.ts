import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { getPlayerFacingPlaces } from "../../src/data/playerFacingPlaces.js";
// @ts-expect-error — JS module, no type declarations
import { PLACES } from "../../src/data/places.js";
// @ts-expect-error — JS module, no type declarations
import fs from "fs";
// @ts-expect-error — JS module, no type declarations
import path from "path";

// ─────────────────────────────────────────────────────────────
// Phase 35-07 (PLACE-05, PLACE-12) — hide Drain Zone + The Void
// Both cards are DESCOPED this phase (see 35-CONTEXT.md) — their untexted
// dead code is cleaned up, but the real cross-cutting mechanics their text
// promises are out of scope. Hidden from deck-building/boosters via the
// same whitelist/blacklist-filter pattern already used for player-facing
// decks, until a future phase implements them properly.
// ─────────────────────────────────────────────────────────────

describe("getPlayerFacingPlaces (PLACE-05, PLACE-12) — Drain Zone + The Void hidden", () => {
  it("filters out exactly Drain Zone and The Void, keeping all other Places", () => {
    const facing = getPlayerFacingPlaces();
    expect(facing.length).toBe(PLACES.length - 2);
  });

  it("Drain Zone is not present in the player-facing list", () => {
    expect(getPlayerFacingPlaces().find((p: any) => p.id === "place_drain_zone")).toBeUndefined();
  });

  it("The Void is not present in the player-facing list", () => {
    expect(getPlayerFacingPlaces().find((p: any) => p.id === "place_the_void")).toBeUndefined();
  });

  it("both cards remain fully defined in the raw PLACES data (not deleted, just hidden)", () => {
    expect(PLACES.find((p: any) => p.id === "place_drain_zone")).toBeDefined();
    expect(PLACES.find((p: any) => p.id === "place_the_void")).toBeDefined();
  });
});

describe("regression guard — engine-critical PLACES importers stay unfiltered", () => {
  it("turnManager.js, placeEffects.js, and cardIndex.js still import the raw PLACES list", () => {
    const files = [
      "src/engine/turnManager.js",
      "src/abilities/placeEffects.js",
      "src/data/cardIndex.js",
    ];
    for (const file of files) {
      const source = fs.readFileSync(path.resolve(file), "utf-8");
      expect(source).toMatch(/import\s*\{[^}]*\bPLACES\b[^}]*\}\s*from\s*['"].*places\.js['"]/);
    }
  });

  it("deck-builder.js and boosterEngine.js import getPlayerFacingPlaces instead of raw PLACES", () => {
    const deckBuilder = fs.readFileSync(path.resolve("src/deck-builder.js"), "utf-8");
    const boosterEngine = fs.readFileSync(path.resolve("src/data/boosterEngine.js"), "utf-8");
    expect(deckBuilder).toContain("getPlayerFacingPlaces");
    expect(boosterEngine).toContain("getPlayerFacingPlaces");
  });
});
