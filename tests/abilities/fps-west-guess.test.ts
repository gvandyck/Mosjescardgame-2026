import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { useMosjeAbility } from "../../src/engine/turnManager.js";
// @ts-expect-error — JS module, no type declarations
import { runMosjeTriggers } from "../../src/engine/mosje/runMosjeTriggers.js";
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from "../../src/data/mosjes.js";
// @ts-expect-error — JS module, no type declarations
import { makeEngineState } from "../helpers/makeEngineState.js";

// ─────────────────────────────────────────────────────────────
// FPS West "Tactical Analysis" (Card List 2.0): once per turn, pay 1 Energy, look at the opponent's
// hand and name the card type they will play next (Mosje / Piecie / Snelle / Place).
// Settled by the opponent's next card played from hand: correct +20 MP, wrong -10 MP.
// ─────────────────────────────────────────────────────────────

const west = (extra: any = {}) => ({ cardId: "mosje_fps_west", name: "FPS West", mp: 25, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false, ...extra });
const foe = () => ({ cardId: "mosje_x", name: "X", mp: 40, level: 1, isDefeated: false, traits: {}, statusEffects: [] });

function guessState(card_type: string | undefined, energy = 3) {
  const s: any = makeEngineState({
    turnNumber: 3,
    players: { player_1: { energy, activeSlots: [west(), null] }, player_2: { activeSlots: [foe(), null] } },
  });
  if (card_type) s._pendingTargets = { card_type };
  return s;
}
const mine = (s: any) => s.players.player_1.activeSlots[0];

describe("FPS West Tactical Analysis (activated half)", () => {
  it("pays 1 Energy, stores the guess on FPS West and shows the opponent's hand to the acting player only", () => {
    const res = useMosjeAbility(guessState("PIECIE"), "player_1", "mosje_fps_west");
    expect(res.success).toBe(true);
    expect(res.state.players.player_1.energy).toBe(2);
    expect(mine(res.state).fpsWestGuess).toBe("PIECIE");
    expect(res.state.revealedHandTo).toEqual({ viewerId: "player_1", turnNumber: 3 });
    expect(mine(res.state).mp).toBe(25);
  });
  it("is refused with 0 Energy and without a valid type", () => {
    expect(useMosjeAbility(guessState("PIECIE", 0), "player_1", "mosje_fps_west").error).toBe("Not enough Energy");
    expect(useMosjeAbility(guessState(undefined), "player_1", "mosje_fps_west").success).toBe(false);
    expect(useMosjeAbility(guessState("QUEST"), "player_1", "mosje_fps_west").success).toBe(false);
  });
  it("once per turn", () => {
    const res = useMosjeAbility(guessState("MOSJE"), "player_1", "mosje_fps_west");
    expect(useMosjeAbility(res.state, "player_1", "mosje_fps_west").error).toBe("Ability already used this turn");
  });
});

describe("FPS West Tactical Analysis (settling half)", () => {
  const guessed = (type: string) => useMosjeAbility(guessState(type), "player_1", "mosje_fps_west").state;
  const played = (s: any, cardType: string) => runMosjeTriggers(s, "cardPlayedFromHand", { playerId: "player_2", cardType });

  it.each([["MOSJE", "MOSJE"], ["PIECIE", "PIECIE"], ["SNELLE", "SNELLE_PIECIE"], ["PLACE", "PLACE"]])("guess %s correct when the opponent plays %s: +20", (guess, played_) => {
    expect(mine(played(guessed(guess), played_)).mp).toBe(45);
  });
  it("wrong guess: -10, and the guess resolves only once", () => {
    const once = played(guessed("PIECIE"), "SNELLE_PIECIE");
    expect(mine(once).mp).toBe(15);
    expect(mine(once).fpsWestGuess).toBeUndefined();
    expect(mine(played(once, "PIECIE")).mp).toBe(15);
  });
  it("the owner's own plays do not settle it", () => {
    const s = guessed("PIECIE");
    expect(mine(runMosjeTriggers(s, "cardPlayedFromHand", { playerId: "player_1", cardType: "PIECIE" })).fpsWestGuess).toBe("PIECIE");
  });
  it("no card played by the end of the opponent's turn counts as wrong (-10)", () => {
    const s = runMosjeTriggers(guessed("PIECIE"), "endOfTurn", { playerId: "player_2" });
    expect(mine(s).mp).toBe(15);
    expect(mine(s).fpsWestGuess).toBeUndefined();
  });
  it("the owner's own end of turn does not expire the guess", () => {
    expect(mine(runMosjeTriggers(guessed("PIECIE"), "endOfTurn", { playerId: "player_1" })).fpsWestGuess).toBe("PIECIE");
  });
  it("a sideways FPS West settles nothing", () => {
    const s = guessed("PIECIE");
    mine(s).sideways = true;
    expect(mine(played(s, "SNELLE_PIECIE")).mp).toBe(25);
  });
});

describe("FPS West ability description — guessing game text", () => {
  it("uses the Card List 2.0 Tactical Analysis text (name the card type; correct +20, wrong -10) and drops the legacy wording", () => {
    const w = MOSJES.find((m: any) => m.id === "mosje_fps_west");
    expect(w).toBeTruthy();
    expect(w.abilityDescription).toContain("Tactical Analysis");
    expect(w.abilityDescription).toContain("name the card type");
    expect(w.abilityDescription).toContain("Correct: gain 20 MP");
    expect(w.abilityDescription).not.toContain("predict");
    expect(w.abilityDescription).not.toContain("Pay 10 MP");
  });
});
