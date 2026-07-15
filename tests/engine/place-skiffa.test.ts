import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { resolvePlaceEffect } from "../../src/abilities/placeEffects.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";
// @ts-expect-error — JS module, no type declarations
import { PLACES } from "../../src/data/places.js";
// @ts-expect-error — JS module, no type declarations
import fs from "fs";
// @ts-expect-error — JS module, no type declarations
import path from "path";

// ─────────────────────────────────────────────────────────────
// Phase 35-05 (PLACE-10) — Skiffa reconciliation
// Old theme ("discard 1 OR lose 15 MP") was never actually built as a
// choice — the engine always applied -15 to non-SUBSTANCE Mosjes.
// Replaced per the locked ruling with a flat +2 dice-roll bonus for
// Social-category quests, implemented as an inline main.js dice-bonus
// term (matching Synergy Chamber's own precedent) rather than a
// dispatcher-routed state mutation — so effect_skiffa is deleted
// outright, not replaced with a new dispatcher body.
// Task 1 (this file, first describe block): places.js/placeEffects.js.
// Task 2 (second describe block): main.js dice-bonus wiring, verified
// via source assertion since main.js is a browser-only entry point the
// unit suite never imports (per CLAUDE.md).
// ─────────────────────────────────────────────────────────────

describe("place_skiffa (PLACE-10) — Task 1: dead discard/-15 mechanic removed", () => {
  it("place_skiffa.trigger is ON_QUEST and description no longer mentions discard/SUBSTANCE", () => {
    const place = PLACES.find((p: any) => p.id === "place_skiffa");
    expect(place.trigger).toBe("ON_QUEST");
    expect(place.description).not.toContain("discard");
    expect(place.description).not.toContain("SUBSTANCE");
  });

  it("resolvePlaceEffect(ON_QUEST) with Skiffa active no longer applies any MP loss", () => {
    const state = createEngineState({
      activePlace: "place_skiffa",
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: "mosje_a",
              name: "Mosje A",
              traits: {},
              mp: 50,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
        player_2: { activeSlots: [] },
      },
    });
    const after = resolvePlaceEffect(state, "ON_QUEST", { playerId: "player_1" });
    expect(after.players.player_1.activeSlots[0].mp).toBe(50);
  });
});

describe("place_skiffa (PLACE-10) — Task 2: main.js +2 Social dice bonus, getSkiffaRerolls removed", () => {
  const mainJsSource = fs.readFileSync(path.resolve("src/main.js"), "utf-8");

  it("getSkiffaRerolls no longer exists anywhere in main.js", () => {
    expect(mainJsSource).not.toContain("getSkiffaRerolls");
  });

  it("the modal's skiffaRerolls parameter is now sourced only from tweedeKansReroll (Tweede Kans preserved)", () => {
    const matches = mainJsSource.match(/skiffaRerolls: tweedeKansReroll/g) || [];
    expect(matches.length).toBe(2);
  });

  it("both quest-attempt call sites gate a Social-quest +2 bonus on place_skiffa", () => {
    const matches = mainJsSource.match(/questDef\.category === 'Social'/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(mainJsSource).toContain("place_skiffa");
  });
});
