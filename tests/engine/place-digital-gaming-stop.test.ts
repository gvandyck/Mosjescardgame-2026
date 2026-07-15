import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { applyPlaceEffectsOnQuest } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";
// @ts-expect-error — JS module, no type declarations
import fs from "fs";
// @ts-expect-error — JS module, no type declarations
import path from "path";

// ─────────────────────────────────────────────────────────────
// Phase 35-04 (PLACE-09) — Digital Gaming Stop reconciliation
// Old effect set a dead `questAutoSuccess` flag with zero consumers in
// src/. Replaced per the locked ruling with the card's actual text:
// +10 MP to the questing Mosje while a DIGITAL-EQUIPMENT Piecie is
// active on that player's field. These tests go through the REAL
// ON_QUEST dispatch path (applyPlaceEffectsOnQuest → resolvePlaceEffect).
// ─────────────────────────────────────────────────────────────

function buildQuestState(piecieSlots: any[]) {
  return createEngineState({
    activePlayerId: "player_1",
    activePlace: "place_digital_gaming_stop",
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_a",
            name: "Questing Mosje",
            traits: { digital: 2 },
            mp: 20,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
        ],
        piecieSlots,
      },
      player_2: { activeSlots: [] },
    },
  });
}

describe("place_digital_gaming_stop (PLACE-09) — DIGITAL-EQUIPMENT +10 MP, dead auto-succeed removed", () => {
  it("grants +10 MP to the questing Mosje when an activated DIGITAL-EQUIPMENT Piecie is on the field", () => {
    const state = buildQuestState([
      { cardId: "piecie_keyboard", type: "PIECIE", activated: true },
      null,
      null,
      null,
      null,
    ]);
    const after = applyPlaceEffectsOnQuest(state, "player_1", { questRequirement: "technical" }, true, 0);
    expect(after.players.player_1.activeSlots[0].mp).toBe(30);
  });

  it("grants no bonus when the DIGITAL-EQUIPMENT Piecie is still face-down (not activated)", () => {
    const state = buildQuestState([
      { cardId: "piecie_keyboard", type: "PIECIE", activated: false },
      null,
      null,
      null,
      null,
    ]);
    const after = applyPlaceEffectsOnQuest(state, "player_1", { questRequirement: "technical" }, true, 0);
    expect(after.players.player_1.activeSlots[0].mp).toBe(20);
  });

  it("never sets the old dead questAutoSuccess flag (source assertion)", () => {
    const filePath = path.resolve("src/abilities/placeEffects.js");
    const content = fs.readFileSync(filePath, "utf-8");
    const fnMatch = content.match(/export function effect_digital_gaming_stop[\s\S]*?\n}/);
    expect(fnMatch).not.toBeNull();
    expect(fnMatch![0]).not.toContain("questAutoSuccess");
  });
});
