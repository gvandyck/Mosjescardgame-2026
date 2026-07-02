import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { resolveQuest } from "../../src/abilities/questLogic.js";
// @ts-expect-error — JS module, no type declarations
import { checkLevelUp } from "../../src/engine/mpManager.js";

// ─────────────────────────────────────────────────────────────
// Reported bug: reaching Level 3 via a quest does NOT declare the win
// instantly. The Mosje shows "Lvl 3 / 70 MP" (or worse, rolls on to
// "Lvl 4 / 20 MP") because resolveQuest never called checkVictory and
// checkLevelUp let level climb past 3.
//
// Desired behaviour (user ruling 2026-06-20):
//   - Crossing into Level 3 (with ANY leftover MP) = instant win.
//   - Level can never exceed 3; leftover MP is kept and shown.
// ─────────────────────────────────────────────────────────────

function makeSlot(mp: number, level: number) {
  return {
    cardId: "mosje_self",
    name: "Self",
    mp,
    level,
    isDefeated: false,
    traits: {},
    statusEffects: [],
    abilityUsedThisTurn: false,
    mpLostThisTurn: 0,
  };
}

function makePlayer(slot: any) {
  return {
    hand: [] as any[],
    deck: [] as any[],
    discard: [] as any[],
    graveyard: [] as any[],
    activeSlots: [slot, null],
    piecieSlots: [null, null, null, null],
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    hasAttemptedQuestThisTurn: false,
    pieciesPlayedThisTurn: 0,
    totalDamageTaken: 0,
  };
}

function makeState(p1Slot: any) {
  return {
    status: "PLAYING",
    winnerId: null,
    activePlayerId: "player_1",
    activePlace: null,
    turnNumber: 3,
    sharedGeneralQuestDeck: [] as any[],
    players: {
      player_1: makePlayer(p1Slot),
      player_2: makePlayer(makeSlot(50, 0)),
    },
  } as any;
}

function questCard(successMP: number) {
  return {
    id: "quest_test",
    requirementId: "quest_req_test",
    successMP,
    failMP: 0,
  };
}

describe("instant win on reaching Level 3", () => {
  it("resolveQuest declares the win the instant a Mosje crosses into Level 3", () => {
    // Lvl 2 / 90 MP + 80 MP quest success → crosses into Level 3.
    const state = makeState(makeSlot(90, 2));
    const next = resolveQuest(state, "player_1", questCard(80), true);

    const mosje = next.players.player_1.activeSlots[0];
    expect(mosje.level).toBe(3);
    expect(mosje.mp).toBe(70); // leftover MP is kept, per the ruling

    // The win must be finalised in the same call — not deferred to end of turn.
    expect(next.status).toBe("FINISHED");
    expect(next.winnerId).toBe("player_1");
    expect(next.winReason).toBe("LEVEL_3");
  });

  it("checkLevelUp never lets a Mosje exceed Level 3, even on a huge gain", () => {
    // Lvl 2 / 90 MP, then dumped with 250 MP at once.
    const state = makeState(makeSlot(90, 2));
    state.players.player_1.activeSlots[0].mp = 90 + 250; // pre-add raw MP
    const next = checkLevelUp(state, "player_1", 0);

    expect(next.players.player_1.activeSlots[0].level).toBe(3); // never 4 or 5
  });
});
