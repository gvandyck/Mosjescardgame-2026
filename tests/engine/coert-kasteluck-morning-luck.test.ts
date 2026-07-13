import { afterEach, describe, expect, it, vi } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { startTurn, playPiecie } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { ability_coert_kasteluck_morning_luck } from "../../src/abilities/mosjeAbilities.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from "../helpers/testHelpers.js";

// ─────────────────────────────────────────────────────────────
// 2026-07-12 ability-text-engine-reconciliation todo — card 6/10
// Coert KasteLuck — Morning Luck: TEXT WINS (auto turn-start d6 roll), but the
// same-turn-activation grant is wired through the ACTUALLY-working Chris+Youri
// mechanism (canActivateOnTurn in playPiecie) instead of the inert
// freePiecieActivationAvailable flag. Now autoAbility (no manual button).
// ─────────────────────────────────────────────────────────────

function buildKasteLuckState(opts: { kasteLuckAlive?: boolean; kasteLuckSameTurnActivation?: boolean } = {}) {
  const { kasteLuckAlive = true, kasteLuckSameTurnActivation = false } = opts;
  return createEngineState({
    turnNumber: 5,
    activePlayerId: "player_1",
    players: {
      player_1: {
        hand: [{ cardId: "piecie_kannetje_melk", type: "PIECIE" }],
        deck: [{ cardId: "piecie_affoe", type: "PIECIE" }],
        kasteLuckSameTurnActivation,
        activeSlots: [
          kasteLuckAlive
            ? {
                cardId: "mosje_coert_kasteluck",
                name: "[Coert] KasteLuck",
                traits: { creative: 2, social: 2, resilient: 1 },
                mp: 20,
                level: 1,
                isDefeated: false,
                statusEffects: [],
                abilityUsedThisTurn: false,
              }
            : {
                cardId: "mosje_other",
                name: "Some Other Mosje",
                traits: {},
                mp: 20,
                level: 1,
                isDefeated: false,
                statusEffects: [],
                abilityUsedThisTurn: false,
              },
          null,
        ],
        piecieSlots: [null, null, null, null],
      },
    },
  });
}

describe("Coert KasteLuck — Morning Luck (auto turn-start roll)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rolling 4-6 at turn start sets kasteLuckSameTurnActivation on the active player", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // rollDie(6) => 6
    const state = buildKasteLuckState();

    const next = startTurn(state);

    expect(next.players.player_1.kasteLuckSameTurnActivation).toBe(true);
  });

  it("rolling 1-3 at turn start leaves kasteLuckSameTurnActivation false", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // rollDie(6) => 1
    const state = buildKasteLuckState();

    const next = startTurn(state);

    expect(next.players.player_1.kasteLuckSameTurnActivation).toBe(false);
  });

  it("does not roll (no crash, flag stays false) when KasteLuck is not on the field", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // would be a 6 if rolled
    const state = buildKasteLuckState({ kasteLuckAlive: false });

    const next = startTurn(state);

    expect(next.players.player_1.kasteLuckSameTurnActivation).toBe(false);
  });

  it("playPiecie grants same-turn activation and consumes the flag when kasteLuckSameTurnActivation is true", () => {
    const state = buildKasteLuckState({ kasteLuckSameTurnActivation: true });

    const result = playPiecie(state, "player_1", { cardId: "piecie_kannetje_melk", type: "PIECIE" });

    expect(result.success).toBe(true);
    const placed = result.state.players.player_1.piecieSlots.find((s: any) => s !== null);
    expect(placed.canActivateOnTurn).toBe(state.turnNumber); // same-turn, not turnNumber+1
    expect(result.state.players.player_1.kasteLuckSameTurnActivation).toBe(false); // one-shot, consumed
  });

  it("playPiecie waits until next turn (normal rule) when kasteLuckSameTurnActivation is false", () => {
    const state = buildKasteLuckState({ kasteLuckSameTurnActivation: false });

    const result = playPiecie(state, "player_1", { cardId: "piecie_kannetje_melk", type: "PIECIE" });

    expect(result.success).toBe(true);
    const placed = result.state.players.player_1.piecieSlots.find((s: any) => s !== null);
    expect(placed.canActivateOnTurn).toBe(state.turnNumber + 1);
  });

  it("the manual ability entry is a no-op passthrough (mirrors ability_jeffrey_brute_force)", () => {
    const state = buildKasteLuckState();
    const result = ability_coert_kasteluck_morning_luck(state, "player_1");
    expect(result).toBe(state);
  });
});

describe("Coert KasteLuck data", () => {
  it("is flagged autoAbility (hides the manual-activate button, skipped by the bot's manual-ability loop)", () => {
    const kasteLuck = MOSJES.find((m: any) => m.id === "mosje_coert_kasteluck");
    expect(kasteLuck).toBeTruthy();
    expect(kasteLuck.autoAbility).toBe(true);
  });

  it("no longer describes 'play one extra Piecie for free' (neither the old code nor the new ruling)", () => {
    const kasteLuck = MOSJES.find((m: any) => m.id === "mosje_coert_kasteluck");
    expect(kasteLuck.abilityDescription.toLowerCase()).not.toContain("extra piecie");
  });
});
