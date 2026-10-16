import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { resolvePlaceEffect } from "../../src/abilities/placeEffects.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";
// @ts-expect-error — JS module, no type declarations
import { placeSkiffaGrant } from "../../src/abilities/place/placeTurnQuestEffects.js";
// @ts-expect-error — JS module, no type declarations
import { createMosjeSlot } from "../../src/engine/mp/createMosjeSlot.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error — JS module, no type declarations
import { PLACES } from "../../src/data/places.js";

// ─────────────────────────────────────────────────────────────
// Skiffa (Obby 2.0): an Artistic Mosje may reroll 1 die on its own Quest roll; the Digital -10 Power is in places-power.test.ts.
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

describe("place_skiffa (2.0) — Artistic reroll grant", () => {
  const mk = (subtype: string, fresh = false) => {
    const s = createMosjeSlot(MOSJES.find((m: any) => m.id === "mosje_ming_natural"), { level: 1, mp: 40 });
    s.subtype = subtype; s.entryProtected = fresh;
    return s;
  };
  const grant = (slot: any, place = "place_skiffa") => {
    const state = createEngineState({ activePlace: place, turnNumber: 4, activePlayerId: "player_1", players: { player_1: { activeSlots: [slot] }, player_2: { activeSlots: [] } } });
    const player = state.players.player_1;
    placeSkiffaGrant(state, player, slot);
    return player.rerollGrants || [];
  };
  it("an Artistic roller gets exactly one reroll, for that roll only", () => {
    const g = grant(mk("ARTISTIC"));
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ scope: "ownQuest", uses: 1, forRoll: true });
  });
  it("a Digital roller, a fresh Artistic roller and another Place give none", () => {
    expect(grant(mk("DIGITAL"))).toHaveLength(0);
    expect(grant(mk("ARTISTIC", true))).toHaveLength(0);
    expect(grant(mk("ARTISTIC"), "place_the_gym")).toHaveLength(0);
  });
});
