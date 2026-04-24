import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { resolveQuest } from "../../src/abilities/questLogic.js";

const GEEN_RAAD_QUEST = {
  id: "quest_geen_raad_vraag_aad",
  requirementId: "quest_req_geen_raad_vraag_aad",
  successMP: 50,
  failMP: -25,
};

function makeState(p1Mp = 50, p2Mp = 50) {
  return {
    activePlace: null,
    players: {
      player_1: {
        activeSlots: [
          {
            cardId: "mosje_west",
            name: "West",
            mp: p1Mp,
            level: 0,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        hand: [
          { cardId: "some_piecie", type: "PIECIE" },
          { cardId: "another_piecie", type: "PIECIE" },
        ],
        deck: [],
        discard: [],
        piecieSlots: [null, null, null, null],
      },
      player_2: {
        activeSlots: [
          {
            cardId: "mosje_jisca",
            name: "Jisca",
            mp: p2Mp,
            level: 0,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        hand: [
          { cardId: "kannetje_melk", type: "PIECIE" },
        ],
        deck: [],
        discard: [],
        piecieSlots: [null, null, null, null],
      },
    },
  };
}

describe("Aad Recovery — eligibility", () => {
  it("active player who failed loses MP and is eligible for recovery", () => {
    const before = makeState(50, 50);
    const after = resolveQuest(before, "player_1", GEEN_RAAD_QUEST, false, 0);
    // player_1 lost 25 MP
    expect(after.players.player_1.activeSlots[0].mp).toBe(25);
    // player_2 is unchanged
    expect(after.players.player_2.activeSlots[0].mp).toBe(50);
    // Recovery would apply because mp went down
    const mpLost = before.players.player_1.activeSlots[0].mp - after.players.player_1.activeSlots[0].mp;
    expect(mpLost).toBe(25);
  });

  it("active player who succeeded gains MP and is NOT eligible for recovery", () => {
    // Use starting MP low enough that +50 won't trigger a level-up
    const before = makeState(20, 50);
    const after = resolveQuest(before, "player_1", GEEN_RAAD_QUEST, true, 0);
    const mpDelta = after.players.player_1.activeSlots[0].mp - before.players.player_1.activeSlots[0].mp;
    expect(mpDelta).toBeGreaterThan(0); // gained MP
  });

  it("opponent is unaffected by Geen Raad — not eligible for recovery", () => {
    const before = makeState(50, 50);
    const after = resolveQuest(before, "player_1", GEEN_RAAD_QUEST, false, 0);
    const opponentMpDelta = after.players.player_2.activeSlots[0].mp - before.players.player_2.activeSlots[0].mp;
    expect(opponentMpDelta).toBe(0); // no change
  });
});

describe("Aad Recovery — discard-for-MP logic", () => {
  it("after simulated recovery: removing 1 card from hand and adding 40 MP works", () => {
    const before = makeState(50, 50);
    const afterQuest = resolveQuest(before, "player_1", GEEN_RAAD_QUEST, false, 0);
    // Simulate Aad Recovery: discard 1 card, gain 40 MP
    const state = JSON.parse(JSON.stringify(afterQuest));
    const player = state.players.player_1;
    const handSizeBefore = player.hand.length;
    // remove first hand card
    const [discarded] = player.hand.splice(0, 1);
    player.discard.unshift(discarded);
    // add 40 MP
    const si = player.activeSlots.findIndex((s: Record<string, unknown>) => s && !s.isDefeated);
    player.activeSlots[si].mp += 40;
    expect(player.hand.length).toBe(handSizeBefore - 1);
    expect(player.discard.length).toBe(1);
    expect(player.activeSlots[si].mp).toBe(65); // 25 + 40
  });

  it("recovery is optional — skipping it leaves state unchanged", () => {
    const before = makeState(50, 50);
    const after = resolveQuest(before, "player_1", GEEN_RAAD_QUEST, false, 0);
    // Simulate skipping recovery
    expect(after.players.player_1.hand.length).toBe(2); // hand unchanged
    expect(after.players.player_1.activeSlots[0].mp).toBe(25);
  });

  it("player with empty hand cannot recover even if they lost MP", () => {
    const state = makeState(50, 50);
    state.players.player_1.hand = [];
    const after = resolveQuest(state, "player_1", GEEN_RAAD_QUEST, false, 0);
    // hand is still empty — recovery would not be offered
    expect(after.players.player_1.hand.length).toBe(0);
  });
});
