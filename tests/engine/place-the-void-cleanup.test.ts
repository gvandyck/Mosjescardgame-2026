import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { resolveQuest } from "../../src/abilities/questLogic.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";
// @ts-expect-error — JS module, no type declarations
import fs from "fs";
// @ts-expect-error — JS module, no type declarations
import path from "path";

// ─────────────────────────────────────────────────────────────
// Phase 35-07 (PLACE-12) — The Void dead-code cleanup
// baseQuestMpBlocked in questLogic.js's resolveQuest is a REDUNDANT gate:
// mpManager.js's own gainMP/loseMP already unconditionally no-op whenever
// activePlace === 'place_the_void' (untouched by this plan). Removing the
// questLogic.js copy changes zero observable MP outcomes.
//
// NOTE: this dead-code removal is being kept exactly as originally locked-
// planned, despite a deeper design flaw surfacing during 35-07 (mpManager.js's
// blanket block is itself wrong per a fuller ruling on The Void's real
// mechanic — see .planning/todos/pending/2026-07-15-the-void-real-implementation-ruling.md).
// That full redesign is explicitly deferred to a future phase; The Void is
// hidden from all player-facing pools by this same wave's Task 3, so the
// current (imperfect) blanket-block behavior is unreachable in real play.
// ─────────────────────────────────────────────────────────────

function buildQuestState(activePlace: string | null) {
  return createEngineState({
    activePlace,
    activePlayerId: "player_1",
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_a",
            name: "Mosje A",
            traits: { physical: 3 },
            mp: 20,
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
}

describe("place_the_void (PLACE-12) — redundant baseQuestMpBlocked gate removed", () => {
  it("baseQuestMpBlocked no longer exists anywhere in questLogic.js", () => {
    const source = fs.readFileSync(path.resolve("src/abilities/questLogic.js"), "utf-8");
    expect(source).not.toContain("baseQuestMpBlocked");
  });

  it("resolving a quest with The Void active leaves the questing Mosje's MP unchanged (same as before this change)", () => {
    const state = buildQuestState("place_the_void");
    const questDef = { id: "quest_test", category: "Physical", successMP: 60, failMP: -20 };
    const after = resolveQuest(state, "player_1", questDef, true, 0);
    expect(after.players.player_1.activeSlots[0].mp).toBe(20);
  });

  it("resolving a quest with NO active Place applies MP gain/loss normally", () => {
    const state = buildQuestState(null);
    const questDef = { id: "quest_test", category: "Physical", successMP: 60, failMP: -20 };
    const after = resolveQuest(state, "player_1", questDef, true, 0);
    expect(after.players.player_1.activeSlots[0].mp).toBe(80);
  });
});
