import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { ability_amplifier_power_boost, ability_hacker_system_hack } from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { startTurn, useMosjeAbility } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// ─────────────────────────────────────────────────────────────
// 2026-06-17 card-text reconciliation:
//   Amplifier Power Boost — was a +10-MP stub; reworked to "pay 30 MP, arm a
//   double-trigger (your active Mosje's next ability fires twice), max 2/game"
//   reusing the Redbull abilityDoubleTrigger flag.
//   Hacker System Hack — was "force a card into the opponent's hand" (helped them);
//   reworked to "+10 MP, draw 1, once / 5 turns" (slot.systemHackCooldown).
// ─────────────────────────────────────────────────────────────

function oneMosjeState(cardId: string, mp = 50, extra: any = {}): any {
  return createEngineState({
    players: {
      player_1: {
        activeSlots: [
          { cardId, name: cardId, mp, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false, ...extra },
          null,
        ],
      },
    },
  });
}

describe("Amplifier Power Boost — pay 30, arm double-trigger, cap 2/game", () => {
  it("pays 30 MP, arms abilityDoubleTrigger, and counts the use", () => {
    const state = oneMosjeState("mosje_amplifier", 50);
    const next = ability_amplifier_power_boost(state, "player_1");
    expect(next.players.player_1.activeSlots[0].mp).toBe(20);          // 50 − 30
    expect(next.players.player_1.abilityDoubleTrigger).toBe(true);
    expect(next.players.player_1.amplifierUses).toBe(1);
  });

  it("throws when fewer than 30 MP", () => {
    const state = oneMosjeState("mosje_amplifier", 20);
    expect(() => ability_amplifier_power_boost(state, "player_1")).toThrow();
  });

  it("throws once it has been used twice this game", () => {
    const state = oneMosjeState("mosje_amplifier", 90);
    state.players.player_1.amplifierUses = 2;
    expect(() => ability_amplifier_power_boost(state, "player_1")).toThrow();
  });

  it("the armed double actually makes the NEXT ability fire twice", () => {
    // Amplifier in slot 0, Alyssa Fissa (+5 MP per card in hand) in slot 1, 2 cards in hand.
    // Alyssa in slot 0 (her ability gains MP to the first active slot); Amplifier in slot 1.
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: "mosje_alyssa_fissa", name: "Alyssa", mp: 0, level: 0, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            { cardId: "mosje_amplifier", name: "Amplifier", mp: 50, level: 0, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
          ],
          hand: [{ cardId: "piecie_kannetje_melk" }, { cardId: "piecie_kannetje_melk" }],
        },
      },
    });
    const armed = ability_amplifier_power_boost(state, "player_1");
    expect(armed.players.player_1.abilityDoubleTrigger).toBe(true);

    const res = useMosjeAbility(armed, "player_1", "mosje_alyssa_fissa");
    expect(res.success).toBe(true);
    // +5 × 2 cards = +10 single; doubled = +20 (on Alyssa, slot 0).
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(20);
    expect(res.state.players.player_1.abilityDoubleTrigger).toBeFalsy(); // consumed
  });
});

describe("Hacker System Hack — +10 MP, draw 1, 5-turn cooldown", () => {
  it("gains 10 MP, draws a card, and sets the cooldown to 5", () => {
    const state = oneMosjeState("mosje_hacker", 20);
    state.players.player_1.deck = [{ cardId: "piecie_kannetje_melk" }, { cardId: "piecie_pot_of_weed" }];
    state.players.player_1.hand = [];
    const next = ability_hacker_system_hack(state, "player_1");
    expect(next.players.player_1.activeSlots[0].mp).toBe(30);          // +10
    expect(next.players.player_1.hand.length).toBe(1);                 // drew 1
    expect(next.players.player_1.deck.length).toBe(1);
    expect(next.players.player_1.activeSlots[0].systemHackCooldown).toBe(5);
  });

  it("throws while on cooldown", () => {
    const state = oneMosjeState("mosje_hacker", 20, { systemHackCooldown: 3 });
    expect(() => ability_hacker_system_hack(state, "player_1")).toThrow();
  });

  it("startTurn ticks systemHackCooldown down on the starting player's slot", () => {
    const state = oneMosjeState("mosje_hacker", 20, { systemHackCooldown: 5 });
    state.activePlayerId = "player_1";
    const next = startTurn(state);
    expect(next.players.player_1.activeSlots[0].systemHackCooldown).toBe(4);
  });
});
