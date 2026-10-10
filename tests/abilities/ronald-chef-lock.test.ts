import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { ability_ronald_chef_strategic_insight } from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { startTurn, playPiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// ─────────────────────────────────────────────────────────────
// Phase 19 Plan 02 — Ronald Chef "Strategic Insight" reworked into a hand-card lock.
//   Pay 20 MP (via loseMP) to pick a card in the opponent's hand and lock it until
//   your next turn — they can't play it. Once per turn, 3-turn cooldown on the slot.
//   - The chosen opponent card id arrives via state._pendingTargets.ronaldLockCardId.
//   - The ability sets state.players[oppId]._lockedCard = { cardId, byPlayer }.
//   - The play-from-hand functions (playPiecie/Snellie/Mosje/Place) reject a card
//     whose id matches the playing player's _lockedCard.cardId.
//   - startTurn ticks strategicInsightCooldown on the starting player's slots and
//     clears any _lockedCard whose byPlayer is the starting player (lock expires when
//     the locker's turn comes back around).
//   - The old _ronaldPeek deck-peek behaviour is gone; the description is updated.
// ─────────────────────────────────────────────────────────────

// Build a state whose player_1 active slot is Ronald Chef (so the ability finds it
// via String(cardId).includes('ronald_chef')). createEngineState gives a full,
// startTurn-safe engine state; we only override what each test needs.
function ronaldState(ronaldMp = 50): any {
  return createEngineState({
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_ronald_chef",
            name: "[Ronald] The Master Chef",
            traits: { mental: 3, social: 3, physical: 1 },
            mp: ronaldMp,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
      },
    },
  });
}

describe("Ronald Chef Strategic Insight — charge 20 MP + lock an opponent hand card", () => {
  it("charges 20 MP (via loseMP) and locks the chosen opponent card on the opponent", () => {
    const state = ronaldState(50);
    // Give the opponent a hand card and target it for the lock.
    state.players.player_2.hand = [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }];
    state._pendingTargets = { ronaldLockCardId: "piecie_kannetje_melk" };

    const next = ability_ronald_chef_strategic_insight(state, "player_1");

    // 20 MP charged on the Ronald slot (50 → 30; no level change, no active place).
    expect(next.players.player_1.activeSlots[0].mp).toBe(30);
    // Lock recorded on the opponent, attributed to player_1.
    expect(next.players.player_2._lockedCard).toEqual({
      cardId: "piecie_kannetje_melk",
      byPlayer: "player_1",
    });
    // The pending target is consumed.
    expect(next._pendingTargets?.ronaldLockCardId).toBeUndefined();
  });

  it("throws when the Ronald slot has fewer than 20 MP", () => {
    const state = ronaldState(15);
    state.players.player_2.hand = [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }];
    state._pendingTargets = { ronaldLockCardId: "piecie_kannetje_melk" };

    expect(() => ability_ronald_chef_strategic_insight(state, "player_1")).toThrow();
  });

  it("throws when strategicInsightCooldown is still active", () => {
    const state = ronaldState(50);
    state.players.player_1.activeSlots[0].strategicInsightCooldown = 2;
    state.players.player_2.hand = [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }];
    state._pendingTargets = { ronaldLockCardId: "piecie_kannetje_melk" };

    expect(() => ability_ronald_chef_strategic_insight(state, "player_1")).toThrow();
  });

  it("sets strategicInsightCooldown = 3 after a successful use", () => {
    const state = ronaldState(50);
    state.players.player_2.hand = [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }];
    state._pendingTargets = { ronaldLockCardId: "piecie_kannetje_melk" };

    const next = ability_ronald_chef_strategic_insight(state, "player_1");

    expect(next.players.player_1.activeSlots[0].strategicInsightCooldown).toBe(3);
  });

  it("no longer sets the legacy _ronaldPeek deck-peek flag", () => {
    const state = ronaldState(50);
    state.players.player_2.hand = [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }];
    state._pendingTargets = { ronaldLockCardId: "piecie_kannetje_melk" };

    const next = ability_ronald_chef_strategic_insight(state, "player_1");

    expect(next._ronaldPeek).toBeUndefined();
    expect(next._ronaldPeekPlayerId).toBeUndefined();
  });
});

describe("Ronald lock enforcement — a locked hand card cannot be played", () => {
  it("playPiecie rejects a card whose id matches the playing player's _lockedCard.cardId", () => {
    const state = ronaldState(50);
    // player_2 is locked out of piecie_kannetje_melk by player_1.
    state.players.player_2._lockedCard = {
      cardId: "piecie_kannetje_melk",
      byPlayer: "player_1",
    };
    state.players.player_2.hand = [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }];

    const result = playPiecie(
      state,
      "player_2",
      { cardId: "piecie_kannetje_melk", type: "PIECIE" },
      { id: "piecie_kannetje_melk", name: "Kannetje Melk" }
    );

    expect(result.success).toBe(false);
    // The locked card must remain in hand (not consumed by the rejected play).
    expect(
      result.state.players.player_2.hand.some(
        (c: any) => (c.cardId ?? c) === "piecie_kannetje_melk"
      )
    ).toBe(true);
  });
});

describe("startTurn hygiene — cooldown tick + lock expiry", () => {
  it("decrements strategicInsightCooldown on the starting player's slot and clears a lock it set", () => {
    const state = ronaldState(50);
    state.activePlayerId = "player_1";
    state.players.player_1.activeSlots[0].strategicInsightCooldown = 3;
    // player_1 locked a card on player_2 last turn; it expires now that player_1 starts.
    state.players.player_2._lockedCard = {
      cardId: "piecie_kannetje_melk",
      byPlayer: "player_1",
    };

    const next = startTurn(state);

    expect(next.players.player_1.activeSlots[0].strategicInsightCooldown).toBe(2);
    expect(next.players.player_2._lockedCard).toBeUndefined();
  });
});

describe("Ronald Chef ability description", () => {
  it("describes the 2.0 Strategic Insight text: choose a card from the opponent's hand, set face-down, returns to hand", () => {
    const ronald = MOSJES.find((m: any) => m.id === "mosje_ronald_chef");
    expect(ronald).toBeTruthy();
    const desc = ronald.abilityDescription.toLowerCase();
    expect(desc).toContain("strategic insight");
    expect(desc).toContain("look at your opponent's hand and choose 1 card");
    expect(desc).toContain("face-down");
    expect(desc).toContain("returns to their hand");
    expect(desc).not.toContain("predict");
    expect(desc).not.toContain("view opponent hand");
  });
});
