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
// Phase 53-05 (DATA-05) — Obby 2.0: Drain Zone + The Void are playable.
// The accessor filters only on the shared `disabled` flag.
// ─────────────────────────────────────────────────────────────

describe("getPlayerFacingPlaces — Drain Zone + The Void unhidden (Obby 2.0)", () => {
  it("returns exactly the Places that are not disabled", () => {
    expect(getPlayerFacingPlaces()).toEqual(PLACES.filter((p: any) => !p.disabled));
  });

  it("Drain Zone is in the player-facing list", () => {
    expect(getPlayerFacingPlaces().find((p: any) => p.id === "place_drain_zone")).toBeDefined();
  });

  it("The Void is in the player-facing list", () => {
    expect(getPlayerFacingPlaces().find((p: any) => p.id === "place_the_void")).toBeDefined();
  });

  it("no returned Place is disabled", () => {
    expect(getPlayerFacingPlaces().some((p: any) => p.disabled)).toBe(false);
  });

  it("raw PLACES still contains every Place (engine importers unfiltered)", () => {
    expect(PLACES.length).toBeGreaterThanOrEqual(20); // Momentum Factory (V4-only) is hidden in 53-06
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
