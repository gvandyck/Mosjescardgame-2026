import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { ability_amplifier_power_boost } from "../../src/abilities/mosjeAbilities.js";
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
    // DJ 80/20 in slot 0 (Alyssa Fissa became a trigger in 2.0; V4 Lucky Beats gains 10 MP on the first slot), Amplifier in slot 1.
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: "mosje_dj_8020", name: "DJ", mp: 0, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            { cardId: "mosje_amplifier", name: "Amplifier", mp: 50, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
          ],
          hand: [{ cardId: "piecie_kannetje_melk" }, { cardId: "piecie_kannetje_melk" }],
        },
      },
    });
    const armed = ability_amplifier_power_boost(state, "player_1");
    expect(armed.players.player_1.abilityDoubleTrigger).toBe(true);

    const res = useMosjeAbility(armed, "player_1", "mosje_dj_8020");
    expect(res.success).toBe(true);
    // +10 single; doubled = +20 (on slot 0).
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(20);
    expect(res.state.players.player_1.abilityDoubleTrigger).toBeFalsy(); // consumed
  });
});

describe("Hacker System Hack (Card List 2.0) — 1 Energy, top 3 of any deck, +10 MP, once per turn", () => {
  const deck = (...ids: string[]) => ids.map(cardId => ({ cardId }));
  it("reorders the top 3 of the chosen deck, gains 10 MP, pays 1 Energy, no cooldown fields", () => {
    const state = oneMosjeState("mosje_hacker", 20);
    state.players.player_1.energy = 3;
    state.players.player_2.deck = deck("a", "b", "c", "d");
    state._pendingTargets = { deck_owner: "player_2", order: [2, 0, 1] };
    const res = useMosjeAbility(state, "player_1", "mosje_hacker");
    expect(res.success).toBe(true);
    expect(res.state.players.player_2.deck.map((c: any) => c.cardId)).toEqual(["c", "a", "b", "d"]);
    expect(res.state.players.player_1.activeSlots[0].mp).toBe(30);
    expect(res.state.players.player_1.energy).toBe(2);
    expect(res.state.players.player_1.activeSlots[0].systemHackCooldown).toBeUndefined();
  });
  it("works on your own deck and keeps the order when none is given", () => {
    const state = oneMosjeState("mosje_hacker", 20);
    state.players.player_1.deck = deck("a", "b");
    const res = useMosjeAbility(state, "player_1", "mosje_hacker");
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.deck.map((c: any) => c.cardId)).toEqual(["a", "b"]);
  });
  it("refuses a second use in the same turn and without Energy; refuses a bad order", () => {
    const state = oneMosjeState("mosje_hacker", 20);
    state.players.player_1.deck = deck("a", "b", "c");
    const first = useMosjeAbility(state, "player_1", "mosje_hacker");
    expect(useMosjeAbility(first.state, "player_1", "mosje_hacker").error).toBe("Ability already used this turn");
    const broke = oneMosjeState("mosje_hacker", 20);
    broke.players.player_1.energy = 0;
    expect(useMosjeAbility(broke, "player_1", "mosje_hacker").error).toBe("Not enough Energy");
    const bad = oneMosjeState("mosje_hacker", 20);
    bad.players.player_1.deck = deck("a", "b", "c");
    bad._pendingTargets = { order: [0, 0, 1] };
    expect(useMosjeAbility(bad, "player_1", "mosje_hacker").success).toBe(false);
  });
  it("startTurn no longer ticks a cooldown", () => {
    const state = oneMosjeState("mosje_hacker", 20, { systemHackCooldown: 5 });
    state.activePlayerId = "player_1";
    expect(startTurn(state).players.player_1.activeSlots[0].systemHackCooldown).toBe(5);
  });
});
