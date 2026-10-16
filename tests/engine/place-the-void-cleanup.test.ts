import { describe, expect, it } from "vitest";
import { forceQuestResult } from "../helpers/forceQuestResult.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";
// @ts-expect-error — JS module, no type declarations
import fs from "fs";
// @ts-expect-error — JS module, no type declarations
import path from "path";

// ─────────────────────────────────────────────────────────────
// Phase 35-07 (PLACE-12) — The Void dead-code cleanup
// baseQuestMpBlocked in questLogic.js's (V4) resolveQuest was a REDUNDANT gate:
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

  it("2.0: The Void only stops Piecie and Snelle gains - a Quest win still gains MP", () => {
    const state = buildQuestState("place_the_void");
    const after = forceQuestResult(state, "player_1", { questId: "quest_quick_thinking", win: true });
    expect(after.players.player_1.activeSlots[0].mp).toBe(45);
  });

  it("resolving a quest with NO active Place applies MP gain/loss normally", () => {
    const state = buildQuestState(null);
    const after = forceQuestResult(state, "player_1", { questId: "quest_quick_thinking", win: true });
    expect(after.players.player_1.activeSlots[0].mp).toBe(45); // 20 + Quick Thinking win 25 (V4 test used successMP 60)
  });
});
